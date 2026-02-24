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
        const token = decrypt(config.api_token)

        const endpoint = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url
        // Uazapi uses /send/media
        const url = `${endpoint}/send/media`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            // Just forwarding whatever payload the frontend generated 
            // (e.g. number, type, file, text, delay)
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            console.error('API Error:', response.status, errData)
            return NextResponse.json({ error: 'Falha ao enviar mídia', details: errData }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (e) {
        console.error('Error sending whatsapp media:', e)
        return NextResponse.json({ error: 'Erro interno ao enviar mídia' }, { status: 500 })
    }
}
