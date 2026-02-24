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

    const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('organization_id', member.organization_id)
        .single()

    if (!config || !config.api_url || !config.api_token) {
        return NextResponse.json({ error: 'WhatsApp não configurado' }, { status: 404 })
    }

    try {
        const body = await request.json()
        const { webhookUrl } = body

        if (!webhookUrl) {
            return NextResponse.json({ error: 'webhookUrl é obrigatório' }, { status: 400 })
        }

        const token = decrypt(config.api_token)
        const endpoint = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url

        // Configurar webhook na uazapi com o formato correto da API
        const payload = {
            enabled: true,
            url: webhookUrl,
            events: ['messages', 'messages_update', 'connection'],
            excludeMessages: ['wasSentByApi'], // Evita loop de mensagens enviadas pela API
        }

        console.log('[Webhook Config] URL:', `${endpoint}/webhook`)
        console.log('[Webhook Config] Payload:', JSON.stringify(payload))

        const response = await fetch(`${endpoint}/webhook`, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            console.error('[Webhook Config] Error:', response.status, errData)
            return NextResponse.json({ error: 'Falha ao configurar webhook na API do WhatsApp', details: errData }, { status: response.status })
        }

        const data = await response.json()

        // Salvar que o webhook foi configurado
        await supabase
            .from('whatsapp_configs')
            .update({
                webhook_configured: true
            })
            .eq('organization_id', member.organization_id)

        return NextResponse.json({ success: true, data })
    } catch (e) {
        console.error('Error configuring webhook:', e)
        return NextResponse.json({ error: 'Erro interno ao configurar webhook' }, { status: 500 })
    }
}
