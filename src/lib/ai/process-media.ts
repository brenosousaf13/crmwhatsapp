import { AiConfig } from '@/types/ai'
import { createClient } from '@supabase/supabase-js'
import { downloadMediaBase64 } from '@/lib/whatsapp/download-media'
import { transcribeAudioWhisper } from '@/lib/ai/transcribe-audio'
import { analyzeImageVision } from '@/lib/ai/analyze-image'

export async function processSingleMediaMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg: any,
    organizationId: string,
    aiConfig: AiConfig
): Promise<string> {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    switch (msg.tipo) {
        case 'texto':
            return msg.conteudo || ''

        case 'audio': {
            if (msg.media_transcription) {
                return msg.media_transcription
            }

            if (!aiConfig.transcribe_audio) {
                return '[Áudio recebido — Transcrição desativada]'
            }

            if (!msg.whatsapp_message_id) {
                return '[Áudio recebido — Erro de referência de origin]'
            }

            const audioData = await downloadMediaBase64(organizationId, msg.whatsapp_message_id)
            if (!audioData || !audioData.base64) {
                return '[Áudio recebido — Falha no download]'
            }

            const transcription = await transcribeAudioWhisper(audioData.base64, aiConfig)
            if (transcription) {
                await supabaseAdmin
                    .from('mensagens')
                    .update({ media_transcription: transcription })
                    .eq('id', msg.id)
                return transcription
            } else {
                return '[Áudio recebido — não foi possível transcrever]'
            }
        }

        case 'image':
        case 'imagem': {
            const caption = msg.conteudo && msg.conteudo !== '[Mídia]' ? `\nLegenda: ${msg.conteudo}` : ''

            if (msg.media_transcription) {
                return `Imagem: ${msg.media_transcription}${caption}`
            }

            if (!aiConfig.analyze_images) {
                return `[Imagem recebida — Análise desativada]${caption}`
            }

            if (!msg.whatsapp_message_id) {
                return `[Imagem recebida — Erro de referência]${caption}`
            }

            const imageData = await downloadMediaBase64(organizationId, msg.whatsapp_message_id)
            if (!imageData || !imageData.base64) {
                return `[Imagem recebida — Falha no download]${caption}`
            }

            const description = await analyzeImageVision(imageData.base64, imageData.mimetype, aiConfig)
            if (description) {
                await supabaseAdmin
                    .from('mensagens')
                    .update({ media_transcription: description })
                    .eq('id', msg.id)

                return `Imagem: ${description}${caption}`
            } else {
                return `[Imagem recebida${caption}]`
            }
        }

        case 'video': {
            const caption = msg.conteudo && msg.conteudo !== '[Mídia]' ? `: ${msg.conteudo}` : ''
            return `[Vídeo recebido${caption}]`
        }

        case 'document':
        case 'documento': {
            const caption = msg.conteudo && msg.conteudo !== '[Mídia]' ? `: ${msg.conteudo}` : ''
            return `[Documento recebido${caption}]`
        }

        default:
            return msg.conteudo || `[${msg.tipo} recebido]`
    }
}
