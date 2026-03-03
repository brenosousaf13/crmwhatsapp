import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/crypto'

export async function POST(req: Request) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!member) {
            return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
        }

        const payload = await req.json().catch(() => ({}))
        const { message_id } = payload
        console.log('[MediaAPI] Payload recebido:', payload)
        if (!message_id) {
            console.error('[DownloadMediaAPI] message_id is missing inside payload')
            return NextResponse.json({ error: 'message_id é obrigatório' }, { status: 400 })
        }

        const { data: whatsappConfig } = await supabase
            .from('whatsapp_configs')
            .select('api_url, api_token')
            .eq('organization_id', member.organization_id)
            .single()

        if (!whatsappConfig || !whatsappConfig.api_url || !whatsappConfig.api_token) {
            console.error('[DownloadMediaAPI] WhatsApp config is missing for org:', member.organization_id, 'Config:', whatsappConfig)
            return NextResponse.json({ error: 'WhatsApp não configurado' }, { status: 400 })
        }

        const token = decrypt(whatsappConfig.api_token)
        const baseUrl = whatsappConfig.api_url.endsWith('/')
            ? whatsappConfig.api_url.slice(0, -1)
            : whatsappConfig.api_url

        const response = await fetch(`${baseUrl}/message/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({
                id: message_id,
                return_base64: true
            })
        })

        if (!response.ok) {
            console.error('[DownloadMediaAPI] Erro uazapi:', response.status)
            return NextResponse.json({ error: 'Falha ao baixar mídia da instância' }, { status: 502 })
        }

        const data = await response.json()

        return NextResponse.json({
            base64: data.base64Data || data.base64 || data.data || '',
            mimetype: data.mimetype || data.mimeType || 'application/octet-stream'
        })

    } catch (err: unknown) {
        console.error('[DownloadMediaAPI] Erro interno:', err instanceof Error ? err.message : String(err))
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
