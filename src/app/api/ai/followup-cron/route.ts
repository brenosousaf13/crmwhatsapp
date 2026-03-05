import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adjustToBusinessHours, getNextBusinessHour, isWithinBusinessHours } from '@/lib/ai/followup-scheduler'
import { generateFollowupMessage } from '@/lib/ai/followup-generator'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send-message'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
    // Verificar cron secret (descomentar quando configurar VERCEL_CRON_SECRET real)
    // const authHeader = req.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const now = new Date()

    // Buscar todos os follow-ups pendentes cujo horário já passou
    const { data: pendingFollowups, error: pendingErr } = await supabaseAdmin
        .from('followups')
        .select(`
      *,
      leads!inner(
        id, nome, telefone, etapa_id, ia_pausada,
        organization_id, followup_count
      )
    `)
        .eq('status', 'pendente')
        .lte('agendado_para', now.toISOString())
        .order('agendado_para', { ascending: true })
        .limit(50)

    if (pendingErr) {
        console.error('Falha ao buscar followups pendentes:', pendingErr)
        return NextResponse.json({ error: 'Falha DB' }, { status: 500 })
    }

    if (!pendingFollowups || pendingFollowups.length === 0) {
        return NextResponse.json({ processed: 0 })
    }

    let processed = 0

    for (const followup of pendingFollowups) {
        try {
            const lead = followup.leads

            // ── Verificações antes de executar ──

            // Lead pausado?
            if (lead.ia_pausada && followup.tipo === 'ia') {
                await cancelFollowup(followup.id, 'Lead pausado')
                continue
            }

            // Lead em etapa final?
            const { data: stage } = await supabaseAdmin
                .from('etapas_kanban')
                .select('tipo')
                .eq('id', lead.etapa_id)
                .single()

            if (stage?.tipo === 'ganho' || stage?.tipo === 'perdido') {
                await cancelFollowup(followup.id, 'Lead em etapa final')
                continue
            }

            // Lead respondeu desde o agendamento?
            const { data: recentMessages } = await supabaseAdmin
                .from('mensagens')
                .select('id')
                .eq('lead_id', lead.id)
                .eq('direcao', 'entrada')
                .gt('criado_em', followup.criado_em)
                .limit(1)

            if (recentMessages && recentMessages.length > 0) {
                await cancelFollowup(followup.id, 'Lead respondeu antes da execução')
                await supabaseAdmin
                    .from('leads')
                    .update({ followup_ativo: false, followup_count: 0 })
                    .eq('id', lead.id)
                continue
            }

            // Buscar config da IA (para follow-ups da IA)
            const { data: aiConfig } = await supabaseAdmin
                .from('ai_config')
                .select('*')
                .eq('organization_id', lead.organization_id)
                .single()

            // Verificar horário comercial (se configurado)
            if (followup.tipo === 'ia' && aiConfig?.followup_business_hours_only) {
                if (!isWithinBusinessHours(now, aiConfig.business_hours)) {
                    // Reagendar para o próximo horário comercial
                    const nextBusinessHour = getNextBusinessHour(now, aiConfig.business_hours)
                    await supabaseAdmin
                        .from('followups')
                        .update({ agendado_para: nextBusinessHour.toISOString() })
                        .eq('id', followup.id)
                    continue
                }
            }

            // ── Executar o follow-up ──

            let messageToSend: string

            if (followup.tipo === 'ia') {
                // Gerar mensagem contextual via LLM
                messageToSend = await generateFollowupMessage(followup, lead, aiConfig)
            } else {
                // Follow-up humano
                if (followup.mensagem && followup.metadata?.envio_automatico) {
                    messageToSend = followup.mensagem
                } else {
                    // Só notificar o atendente (não enviar mensagem pra rede)
                    await notifyFollowupDue(followup, lead)
                    await supabaseAdmin
                        .from('followups')
                        .update({
                            status: 'executado',
                            executado_em: now.toISOString()
                        })
                        .eq('id', followup.id)
                    processed++
                    continue
                }
            }

            // Enviar mensagem via WhatsApp API
            await sendWhatsAppMessage(lead.organization_id, {
                number: lead.telefone,
                text: messageToSend
            })

            // Salvar mensagem no banco
            await supabaseAdmin.from('mensagens').insert({
                lead_id: lead.id,
                organization_id: lead.organization_id,
                direcao: 'saida',
                conteudo: messageToSend,
                tipo: 'texto',
                enviada_por_ia: followup.tipo === 'ia',
                criado_em: now.toISOString(),
                lida: true
            })

            // Atualizar follow-up como executado
            await supabaseAdmin
                .from('followups')
                .update({
                    status: 'executado',
                    executado_em: now.toISOString(),
                    mensagem_enviada: messageToSend
                })
                .eq('id', followup.id)

            // Atualizar metadata do lead
            await supabaseAdmin
                .from('leads')
                .update({
                    ultimo_followup_em: now.toISOString(),
                    followup_count: (lead.followup_count || 0) + 1,
                    ultima_mensagem_at: now.toISOString()
                })
                .eq('id', lead.id)

            // Registrar evento temporal do LEAD audit logger
            await supabaseAdmin.from('lead_events').insert({
                lead_id: lead.id,
                organization_id: lead.organization_id,
                tipo: 'followup_enviado',
                descricao: `Follow-up ${followup.tipo === 'ia' ? 'automático (IA)' : 'manual'} — tentativa ${followup.tentativa_numero}/${followup.max_tentativas}`,
                metadata: {
                    followup_id: followup.id,
                    tipo: followup.tipo,
                    tentativa: followup.tentativa_numero,
                    mensagem: messageToSend.substring(0, 100)
                }
            })

            if (followup.tipo === 'humano') {
                await notifyFollowupDue(followup, lead, true) // notificar emissão de auto-mensagem
            }

            // ── Agendar próxima tentativa (se for IA e não atingiu máximo) ──
            if (followup.tipo === 'ia' && followup.tentativa_numero < followup.max_tentativas) {
                // ex: [4, 24, 72] - Se a que enviamos agora era tent 1, agendar indice 1 (24)
                const intervalsStr = aiConfig?.followup_intervals
                const intervals = Array.isArray(intervalsStr) ? intervalsStr : [4, 24, 72]
                const nextInterval = intervals[followup.tentativa_numero] || intervals[intervals.length - 1] || 72

                let nextDate = new Date()
                nextDate.setHours(nextDate.getHours() + nextInterval)

                if (aiConfig?.followup_business_hours_only) {
                    nextDate = adjustToBusinessHours(nextDate, aiConfig.business_hours)
                }

                await supabaseAdmin.from('followups').insert({
                    organization_id: lead.organization_id,
                    lead_id: lead.id,
                    tipo: 'ia',
                    agendado_para: nextDate.toISOString(),
                    tentativa_numero: followup.tentativa_numero + 1,
                    max_tentativas: followup.max_tentativas,
                    contexto: followup.contexto,
                    motivo: `Follow-up automático (tentativa ${followup.tentativa_numero + 1})`,
                    status: 'pendente'
                })
            } else if (followup.tipo === 'ia' && followup.tentativa_numero >= followup.max_tentativas) {
                // Atingiu máximo de tentativas — desativar o badge
                await supabaseAdmin
                    .from('leads')
                    .update({ followup_ativo: false })
                    .eq('id', lead.id)
            }

            processed++

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            console.error(`Erro ao processar follow-up ${followup.id}:`, errorMessage)
            await supabaseAdmin
                .from('followups')
                .update({ status: 'falhou', metadata: { ...followup.metadata, error: errorMessage } })
                .eq('id', followup.id)
        }
    }

    return NextResponse.json({ processed })
}

async function cancelFollowup(followupId: string, motivo: string) {
    await supabaseAdmin
        .from('followups')
        .update({ status: 'cancelado', notas: motivo })
        .eq('id', followupId)
}

// Emite alerta para CRM UI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyFollowupDue(followup: any, lead: any, hasSent = false) {
    await supabaseAdmin.from('notifications').insert({
        organization_id: lead.organization_id,
        user_id: followup.criado_por,
        tipo: hasSent ? 'followup_sent' : 'followup_due',
        titulo: hasSent ? 'Follow-up Automático Enviado' : 'Follow-up Pendente',
        descricao: `${lead.nome || lead.telefone} — ${hasSent ? 'A mensagem auto. foi disparada.' : (followup.notas || 'Hora de acompanhar esse lead!')}`,
        link: `/chat?lead=${lead.id}`,
        metadata: { lead_id: lead.id, followup_id: followup.id }
    })
}
