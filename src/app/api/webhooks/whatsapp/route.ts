import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Using service role key for admin client since this is an external webhook without user context
function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org')

    if (!orgId) {
        return NextResponse.json({ error: 'org parameter required' }, { status: 400 })
    }

    try {
        const payload = await request.json()
        const supabase = createAdminClient()

        console.log('[Webhook Incoming RAW]', JSON.stringify(payload))

        // Determine the event string (uazapi might use 'event', 'type', or 'action')
        const eventType = payload.event || payload.type || payload.event_type || 'unknown'

        // Log the raw webhook event
        const { error: logError } = await supabase.from('webhook_logs').insert({
            organization_id: orgId,
            event_type: eventType,
            payload: payload
        })

        if (logError) {
            console.error('[Webhook] Failed to save log:', logError.message)
        }

        switch (eventType) {
            case 'message':
            case 'messages':
            case 'messages.upsert': // Evolution API uses this sometimes
                await handleIncomingMessage(supabase, orgId, payload.data || payload.message || payload)
                break
            case 'messages_update':
            case 'messages.update':
                await handleMessageUpdate(supabase, orgId, payload.data || payload)
                break
            case 'connection':
            case 'connection.update':
                await handleConnectionChange(supabase, orgId, payload.data || payload)
                break
        }

        return NextResponse.json({ received: true })
    } catch (e) {
        console.error('Error processing webhook:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleIncomingMessage(supabase: SupabaseClient, orgId: string, data: any) {
    if (!data || !data.chatid) return

    // Skip all outgoing messages — they are already saved by /api/whatsapp/send/text
    // This prevents duplicates when uazapi echoes back our own sent messages
    if (data.fromMe) return

    // Skip group messages
    if (data.chatid.includes('@g.us')) return

    // 1. Extract phone number (raw digits)
    const phone = data.chatid.split('@')[0]
    const senderName = data.senderName || phone

    // 2. Prevent duplicate messages (via whatsapp_message_id)
    if (data.messageid) {
        const { data: existing } = await supabase
            .from('mensagens')
            .select('id')
            .eq('organization_id', orgId)
            .eq('whatsapp_message_id', data.messageid)
            .limit(1)
            .maybeSingle()

        if (existing) return // Already saved
    }

    // 3. Find or create lead — use flexible phone matching
    // Leads may have phone stored as "+5531999999999", "5531999999999", "(31) 99999-9999", etc.
    let leadId = null

    // Try exact match first
    const { data: exactLead } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', orgId)
        .eq('telefone', phone)
        .single()

    if (exactLead) {
        leadId = exactLead.id
    } else {
        // Try partial match with ilike (phone number ends with at least last 10 digits)
        const lastDigits = phone.slice(-10)
        const { data: fuzzyLead } = await supabase
            .from('leads')
            .select('id')
            .eq('organization_id', orgId)
            .ilike('telefone', `%${lastDigits}%`)
            .limit(1)
            .single()

        if (fuzzyLead) {
            leadId = fuzzyLead.id
        } else {
            // Create new lead
            const { data: etapa } = await supabase
                .from('etapas_kanban')
                .select('id')
                .eq('organization_id', orgId)
                .order('ordem')
                .limit(1)
                .single()

            const { data: newLead } = await supabase
                .from('leads')
                .insert({
                    organization_id: orgId,
                    nome: senderName,
                    telefone: phone,
                    etapa_id: etapa?.id
                })
                .select('id')
                .single()

            leadId = newLead?.id
        }
    }

    if (!leadId) return

    // 4. Map message type
    let tipoMsg = 'texto'
    if (data.messageType === 'conversation' || data.messageType === 'extendedTextMessage') tipoMsg = 'texto'
    else if (data.messageType === 'imageMessage') tipoMsg = 'imagem'
    else if (data.messageType === 'audioMessage' || data.messageType === 'pttMessage') tipoMsg = 'audio'
    else if (data.messageType === 'videoMessage') tipoMsg = 'video'
    else if (data.messageType === 'documentMessage' || data.messageType === 'documentWithCaptionMessage') tipoMsg = 'documento'

    // 5. Save message
    await supabase.from('mensagens').insert({
        organization_id: orgId,
        lead_id: leadId,
        direcao: 'entrada',
        conteudo: data.text || '[Mídia]',
        tipo: tipoMsg,
        media_url: data.fileURL,
        whatsapp_message_id: data.messageid,
        lida: false,
        timestamp: new Date(data.messageTimestamp || Date.now()).toISOString()
    })

    // 5. Update lead timestamp and unread count
    const now = new Date(data.messageTimestamp || Date.now()).toISOString()

    if (!data.fromMe) {
        await supabase.from('leads').update({
            atualizado_em: now,
            ultima_mensagem_at: now
        }).eq('id', leadId)

        // atomic increment using the new RPC function
        await supabase.rpc('increment_nao_lidas', { lead_row_id: leadId })
    } else {
        await supabase.from('leads').update({
            atualizado_em: now,
            ultima_mensagem_at: now,
            mensagens_nao_lidas: 0
        }).eq('id', leadId)
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessageUpdate(supabase: SupabaseClient, orgId: string, data: any) {
    if (!data || !data.messageid || !data.status) return

    // If message was read, update it in our DB
    if (data.status === 'read') {
        await supabase
            .from('mensagens')
            .update({ lida: true })
            .eq('organization_id', orgId)
            .eq('whatsapp_message_id', data.messageid)
            .eq('direcao', 'saida')
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConnectionChange(supabase: SupabaseClient, orgId: string, data: any) {
    if (!data || !data.status) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
        status: data.status,
        last_disconnect_reason: data.reason || null
    }

    if (data.status === 'connected') {
        updateData.last_connected_at = new Date().toISOString()
    } else if (data.status === 'disconnected') {
        updateData.last_disconnected_at = new Date().toISOString()
    }

    await supabase
        .from('whatsapp_configs')
        .update(updateData)
        .eq('organization_id', orgId)
}
