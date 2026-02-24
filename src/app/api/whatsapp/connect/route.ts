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
        const body = await request.json().catch(() => ({}))
        const { phone } = body

        const token = decrypt(config.api_token)

        // If phone is provided, it's a pair code request. Otherwise, QR code request.
        const payload = phone ? { phone } : {}

        const response = await fetch(`${config.api_url}/instance/connect`, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Falha ao conectar com a API do WhatsApp' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (e) {
        console.error('Error connecting whatsapp:', e)
        return NextResponse.json({ error: 'Erro interno ao iniciar conexão' }, { status: 500 })
    }
}
