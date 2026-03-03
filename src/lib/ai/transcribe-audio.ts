import { AiConfig } from '@/types/ai'
import { decrypt } from '@/lib/crypto'

export async function transcribeAudioWhisper(
    base64Audio: string,
    aiConfig: AiConfig
): Promise<string | null> {
    try {
        let whisperKey: string

        if (aiConfig.provider === 'openai') {
            whisperKey = decrypt(aiConfig.api_key)
        } else if (aiConfig.openai_key_for_whisper) {
            whisperKey = decrypt(aiConfig.openai_key_for_whisper)
        } else {
            console.warn('[Whisper AI] Sem chave OpenAI para Whisper — transcrição indisponível')
            return null
        }

        const audioBuffer = Buffer.from(base64Audio, 'base64')
        const blob = new Blob([audioBuffer], { type: 'audio/ogg' })

        const formData = new FormData()
        formData.append('file', blob, 'audio.ogg')
        formData.append('model', 'whisper-1')
        formData.append('language', 'pt')

        console.log('[Whisper AI] Enviando áudio para transcrição (OpenAI)...')

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whisperKey}`
            },
            body: formData
        })

        if (!response.ok) {
            const err = await response.text()
            console.error('[Whisper AI] Erro na transcrição:', response.status, err)
            return null
        }

        const result = await response.json()
        return result.text || null

    } catch (err: unknown) {
        console.error('[Whisper AI] Erro fatal:', err instanceof Error ? err.message : String(err))
        return null
    }
}
