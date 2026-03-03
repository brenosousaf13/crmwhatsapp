import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/crypto'

export async function downloadMediaBase64(
    organizationId: string,
    messageId: string
): Promise<{ base64: string; mimetype: string } | null> {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: config } = await supabaseAdmin
            .from('whatsapp_configs')
            .select('api_url, api_token')
            .eq('organization_id', organizationId)
            .single()

        if (!config || !config.api_url || !config.api_token) {
            console.error('[DownloadMedia] WhatsApp config missing for org:', organizationId)
            return null
        }

        const token = decrypt(config.api_token)

        // Trim slashes to ensure valid URL
        const baseUrl = config.api_url.endsWith('/')
            ? config.api_url.slice(0, -1)
            : config.api_url

        const response = await fetch(`${baseUrl}/message/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({
                id: messageId,
                return_base64: true
            })
        })

        if (!response.ok) {
            const err = await response.text()
            console.error('[DownloadMedia] uazapi error:', response.status, err)
            return null
        }

        const data = await response.json()

        return {
            base64: data.base64Data || data.base64 || data.data || '',
            mimetype: data.mimetype || data.mimeType || ''
        }
    } catch (e: any) {
        console.error('[DownloadMedia] Fatal error:', e.message)
        return null
    }
}
