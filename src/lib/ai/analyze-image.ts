import { AiConfig } from '@/types/ai'
import { decrypt } from '@/lib/crypto'

export async function analyzeImageVision(
    base64Image: string,
    mimetype: string,
    aiConfig: AiConfig
): Promise<string | null> {
    try {
        const apiKey = decrypt(aiConfig.api_key)
        const mediaType = mimetype || 'image/jpeg'

        console.log(`[Vision API] Analisando imagem via ${aiConfig.provider}...`)

        switch (aiConfig.provider) {
            case 'openai': {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        max_tokens: 300,
                        messages: [{
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Descreva essa imagem de forma objetiva e concisa para que alguém consiga entender do que se trata sem ver a imagem. Responda em português.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mediaType};base64,${base64Image}`,
                                        detail: 'low'
                                    }
                                }
                            ]
                        }]
                    })
                })

                if (!response.ok) {
                    const err = await response.text()
                    console.error('[Vision OpenAI] Erro HTTP:', response.status, err)
                    return null
                }

                const data = await response.json()
                return data.choices?.[0]?.message?.content || null
            }

            case 'anthropic': {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 300,
                        messages: [{
                            role: 'user',
                            content: [
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: mediaType,
                                        data: base64Image
                                    }
                                },
                                {
                                    type: 'text',
                                    text: 'Descreva essa imagem de forma objetiva e concisa para que alguém consiga entender do que se trata sem ver a imagem. Responda em português.'
                                }
                            ]
                        }]
                    })
                })

                if (!response.ok) {
                    const err = await response.text()
                    console.error('[Vision Anthropic] Erro:', response.status, err)
                    return null
                }

                const data = await response.json()
                return data.content?.[0]?.text || null
            }

            case 'google': {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    inlineData: {
                                        mimeType: mediaType,
                                        data: base64Image
                                    }
                                },
                                {
                                    text: 'Descreva essa imagem de forma objetiva e concisa para que alguém consiga entender do que se trata sem ver a imagem. Responda em português.'
                                }
                            ]
                        }]
                    })
                })

                if (!response.ok) {
                    const err = await response.text()
                    console.error('[Vision Google] Erro HTTP:', response.status, err)
                    return null
                }

                const data = await response.json()
                return data.candidates?.[0]?.content?.parts?.[0]?.text || null
            }

            default:
                console.warn('[Vision API] Provider não suportado para imagem:', aiConfig.provider)
                return null
        }

    } catch (err: any) {
        console.error('[Vision API] Erro fatal:', err.message)
        return null
    }
}
