'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function AudioPlayer({ messageId }: { messageId: string }) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        let isMounted = true
        let objectUrl = ''

        const loadAudio = async () => {
            if (loading || error) return
            setLoading(true)

            try {
                const res = await fetch('/api/whatsapp/media/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message_id: messageId })
                })

                if (!res.ok) throw new Error('Falha no download via uazapi')

                const { base64, mimetype } = await res.json()
                const blob = base64ToBlob(base64, mimetype || 'audio/ogg')
                objectUrl = URL.createObjectURL(blob)

                if (isMounted) setAudioUrl(objectUrl)
            } catch (err) {
                console.error('Erro ao carregar áudio:', err)
                if (isMounted) setError(true)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadAudio()

        return () => {
            isMounted = false
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [messageId])

    if (error) return <span className="text-xs italic text-red-400">⚠️ Áudio indisponível ou expirado</span>
    if (loading) return <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="animate-spin" size={14} /> Carregando áudio...</div>
    if (!audioUrl) return null

    return (
        <audio controls className="max-w-[240px] h-10" preload="metadata">
            <source src={audioUrl} type="audio/ogg" />
            Seu navegador não suporta áudio.
        </audio>
    )
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const bytes = atob(base64)
    const array = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes.charCodeAt(i)
    }
    return new Blob([array], { type: mimeType })
}
