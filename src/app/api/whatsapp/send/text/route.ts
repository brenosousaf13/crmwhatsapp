import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) {
        return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const orgId = member.organization_id

    // Buscar configuração do WhatsApp
    const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('organization_id', orgId)
        .single()

    if (!config || !config.api_url || !config.api_token) {
        return NextResponse.json({ error: 'WhatsApp não configurado' }, { status: 404 })
    }

    try {
        const { leadId, text } = await request.json()

        if (!leadId || !text) {
            return NextResponse.json({ error: 'leadId e text são obrigatórios' }, { status: 400 })
        }

        // 1. Buscar o telefone do lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, telefone, nome')
            .eq('id', leadId)
            .eq('organization_id', orgId)
            .single()

        if (leadError || !lead) {
            return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
        }

        // Montar o número no formato que uazapi espera (dígitos, sem @c.us)
        const phoneClean = lead.telefone.replace(/\D/g, '')

        // 2. Enviar via uazapi — POST /send/text com { number, text }
        const token = decrypt(config.api_token)
        const endpoint = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url
        const url = `${endpoint}/send/text`

        const payload = {
            number: phoneClean,
            text: text,
        }

        console.log('[SendText] URL:', url)
        console.log('[SendText] Payload:', JSON.stringify(payload))

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            console.error('[SendText] uazapi Error:', response.status, JSON.stringify(errData))
            return NextResponse.json({ error: 'Falha ao enviar mensagem via WhatsApp', details: errData }, { status: response.status })
        }

        const apiResponse = await response.json()

        // 3. Salvar a mensagem no banco de dados
        const { data: savedMessage, error: msgError } = await supabase
            .from('mensagens')
            .insert({
                organization_id: orgId,
                lead_id: leadId,
                direcao: 'saida',
                conteudo: text,
                tipo: 'texto',
                whatsapp_message_id: apiResponse?.id || apiResponse?.key?.id || null,
                timestamp: new Date().toISOString(),
                lida: true, // Mensagens enviadas por nós são "lidas" por padrão
            })
            .select('id')
            .single()

        if (msgError) {
            console.error('Error saving outgoing message:', msgError)
            // Não retornar erro aqui porque a mensagem já foi enviada via WhatsApp
        }

        // 4. Atualizar ultima_mensagem_at no lead
        await supabase
            .from('leads')
            .update({ ultima_mensagem_at: new Date().toISOString() })
            .eq('id', leadId)
            .eq('organization_id', orgId)

        return NextResponse.json({
            success: true,
            messageId: savedMessage?.id || null,
            whatsappResponse: apiResponse,
        })
    } catch (e) {
        console.error('Error sending whatsapp text:', e)
        return NextResponse.json({ error: 'Erro interno ao enviar mensagem' }, { status: 500 })
    }
}
