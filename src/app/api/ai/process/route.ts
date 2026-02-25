import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Using service role key for backend AI processing without auth context
function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Ensure the function can run for up to 60 seconds on Vercel Pro/Hobby
export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const { organization_id, lead_id } = await request.json()
        if (!organization_id || !lead_id) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Fetch AI Config
        const { data: config } = await supabase
            .from('ai_config')
            .select('*')
            .eq('organization_id', organization_id)
            .single()

        if (!config || !config.enabled || !config.api_key) {
            return NextResponse.json({ status: 'ai_disabled_or_not_configured' })
        }

        // 2. Concat Debounce Logic
        // We wait N seconds. If another webhook fired in the meantime, it updated the queued_at timestamp.
        const delayMs = (config.concat_delay_seconds || 20) * 1000
        await new Promise(resolve => setTimeout(resolve, delayMs))

        const { data: queueRow } = await supabase
            .from('ai_processing_queue')
            .select('queued_at')
            .eq('lead_id', lead_id)
            .single()

        if (!queueRow) {
            return NextResponse.json({ status: 'no_queue_found_aborted' })
        }

        const queuedAtMs = new Date(queueRow.queued_at).getTime()
        const nowMs = Date.now()

        // If the queue timestamp is newer than our delay window (minus 500ms safety buffer), 
        // it means another message arrived while we were waiting. We abort this execution 
        // and let the newer webhook execution handle it.
        if (nowMs - queuedAtMs < delayMs - 500) {
            return NextResponse.json({ status: 'aborted_due_to_concat_interruption' })
        }

        // We are the designated executors. Let's claim it (optional, but good for locks)
        await supabase
            .from('ai_processing_queue')
            .update({ status: 'processing' })
            .eq('lead_id', lead_id)

        // 3. Check Lead Status
        const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', lead_id)
            .single()

        if (!lead || lead.ia_pausada) {
            await supabase.from('ai_processing_queue').delete().eq('lead_id', lead_id)
            return NextResponse.json({ status: 'lead_paused_or_not_found' })
        }

        // 4. Check Business Hours
        if (config.business_hours_enabled && config.business_hours) {
            const date = new Date()
            // simple check based on server time (usually UTC, ideally should convert to Brazil UTC-3)
            // For now, doing simple JS Date parsing. 
            // In a real robust app, use date-fns-tz.
            const brazilTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
            const brazilDay = days[brazilTime.getDay()]
            const hrs = brazilTime.getHours()
            const mins = brazilTime.getMinutes()
            const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

            const dayConfig = config.business_hours[brazilDay]
            if (!dayConfig?.ativo || timeStr < dayConfig.inicio || timeStr > dayConfig.fim) {
                // Out of hours
                if (config.out_of_hours_message) {
                    // Send out of hours message natively via our local API to Uazapi
                    await sendNativeMessage(supabase, organization_id, lead.telefone, config.out_of_hours_message)
                    // Auto-pause AI so we don't spam out of hours
                    await supabase.from('leads').update({
                        ia_pausada: true,
                        ia_pausada_por: 'out_of_hours',
                        ia_pausada_em: new Date().toISOString()
                    }).eq('id', lead_id)
                }
                await supabase.from('ai_processing_queue').delete().eq('lead_id', lead_id)
                return NextResponse.json({ status: 'out_of_business_hours' })
            }
        }

        // 5. Fetch Database Context
        const { data: mensagens } = await supabase
            .from('mensagens')
            .select('*')
            .eq('lead_id', lead_id)
            .order('timestamp', { ascending: false })
            .limit(config.context_window || 15)

        const orderedMensagens = (mensagens || []).reverse()

        // 6. Build the LLM Context
        const systemPrompt = config.system_prompt
            .replace('{{lead.nome}}', lead.nome || 'Cliente')
            .replace('{{lead.telefone}}', lead.telefone || '')

        // Simple RAG context injection
        const { data: kbDocs } = await supabase
            .from('ai_knowledge_docs')
            .select('content')
            .eq('organization_id', organization_id)
            .eq('status', 'processed')
            .limit(5)

        let ragContext = ''
        if (kbDocs && kbDocs.length > 0) {
            ragContext = "\n\n--- BASE DE CONHECIMENTO ---\nUtilize essas informações estritamente se necessário:\n" +
                kbDocs.map(d => d.content).join('\n---\n').substring(0, 15000) // cap length
        }

        const messagesForLlm = [
            { role: 'system', content: systemPrompt + ragContext },
            ...orderedMensagens.map(m => {
                let text = m.conteudo || ''
                if (m.tipo === 'audio') text = '[Mensagem de Áudio Não Transcrita]'
                else if (m.tipo === 'imagem') text = '[Mensagem de Imagem]'

                return {
                    role: m.direcao === 'saida' ? 'assistant' : 'user',
                    content: text
                }
            })
        ]

        // 7. Invoke LLM Based on Provider
        const startTime = Date.now()
        let responseText = ''
        let inputTokens = 0
        let outputTokens = 0
        let llmError = null

        try {
            if (config.provider === 'openai') {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.api_key}`
                    },
                    body: JSON.stringify({
                        model: config.model,
                        temperature: config.temperature,
                        messages: messagesForLlm,
                        // TODO: Map tools array to OpenAI JSON Schema based on config.enabled_tools
                    })
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error.message)
                responseText = data.choices[0]?.message?.content || ''
                inputTokens = data.usage?.prompt_tokens || 0
                outputTokens = data.usage?.completion_tokens || 0

            } else if (config.provider === 'anthropic') {
                // Format for Anthropic since system prompt is separate
                const system = messagesForLlm[0].content
                const thread = messagesForLlm.slice(1).map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))

                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.api_key,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: config.model,
                        temperature: config.temperature,
                        max_tokens: 1024,
                        system: system,
                        messages: thread
                    })
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error.message)
                responseText = data.content?.[0]?.text || ''
                inputTokens = data.usage?.input_tokens || 0
                outputTokens = data.usage?.output_tokens || 0

            } else if (config.provider === 'google') {
                // Format for Gemini
                const thread = messagesForLlm.map(m => {
                    if (m.role === 'system') return null;
                    return {
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }
                }).filter(Boolean)

                const sysPart = {
                    role: "user",
                    parts: [{ text: `SYSTEM INSTRUCTION: ${messagesForLlm[0].content}` }]
                }
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.api_key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [sysPart, ...thread],
                        generationConfig: {
                            temperature: config.temperature
                        }
                    })
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error.message)
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('[LLM ERROR]', err)
            llmError = err.message
        }

        const endTime = Date.now()

        // 8. Physical action: Send WhatsApp Message & Save to DB
        if (responseText && !llmError) {
            // Apply response delay to mimic human typing
            await new Promise(resolve => setTimeout(resolve, config.response_delay_ms || 1000))

            // Send via Native WhatsApp Route we built earlier
            await sendNativeMessage(supabase, organization_id, lead.telefone, responseText)

            // Save to DB
            await supabase.from('mensagens').insert({
                organization_id,
                lead_id,
                direcao: 'saida',
                conteudo: responseText,
                tipo: 'texto',
                enviada_por_ia: true,
                lida: false,
                timestamp: new Date().toISOString()
            })

            // Mark last activity
            await supabase.from('leads').update({
                atualizado_em: new Date().toISOString(),
                ultima_mensagem_at: new Date().toISOString()
            }).eq('id', lead_id)
        }

        // 9. Write Telemetry Log
        await supabase.from('ai_logs').insert({
            organization_id,
            lead_id,
            input_text: JSON.stringify(messagesForLlm, null, 2),
            input_tokens: inputTokens,
            output_text: responseText,
            output_tokens: outputTokens,
            tool_calls: null, // Placeholder for tools later
            model: config.model,
            provider: config.provider,
            response_time_ms: endTime - startTime,
            estimated_cost: ((inputTokens / 1000) * 0.005) + ((outputTokens / 1000) * 0.015), // Mock average calc
            error: llmError
        })

        // 10. Clean up Queue
        await supabase.from('ai_processing_queue').delete().eq('lead_id', lead_id)

        return NextResponse.json({ success: true, processed: true, response_generated: !!responseText })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('[AI FATAL]', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}

import { decrypt } from '@/lib/crypto'

// Helper to trigger the outbound whatsapp send
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendNativeMessage(supabase: any, organization_id: string, phone: string, text: string) {
    const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('organization_id', organization_id)
        .single()

    if (!config || !config.api_url || !config.api_token) {
        console.error('[AI WhatsApp] Integração WhatsApp não configurada')
        return
    }

    const phoneClean = phone.replace(/\D/g, '')
    const token = decrypt(config.api_token)
    const endpoint = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url
    const url = `${endpoint}/send/text`

    const payload = { number: phoneClean, text: text }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('[AI WhatsApp] Erro uazapi:', response.status, JSON.stringify(errData))
    }
}
