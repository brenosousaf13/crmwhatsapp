import { decrypt } from '@/lib/crypto'
import { createClient } from '@supabase/supabase-js'

export async function sendWhatsAppMessage(organizationId: string, payload: { number: string, text: string }) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar configuração do WhatsApp
    const { data: config } = await supabaseAdmin
        .from('whatsapp_configs')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!config || !config.api_url || !config.api_token) {
        throw new Error('WhatsApp não configurado para esta organização')
    }

    // Montar o número no formato que uazapi espera (dígitos, sem @c.us)
    const phoneClean = payload.number.replace(/\D/g, '')

    // Enviar via uazapi — POST /send/text com { number, text }
    const token = decrypt(config.api_token)
    const endpoint = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url
    const url = `${endpoint}/send/text`

    const requestPayload = {
        number: phoneClean,
        text: payload.text,
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('[SendWhatsAppMessage] uazapi Error:', response.status, JSON.stringify(errData))
        throw new Error(`Falha ao enviar mensagem via WhatsApp: ${response.status}`)
    }

    const apiResponse = await response.json()
    return apiResponse
}
