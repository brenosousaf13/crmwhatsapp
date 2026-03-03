'use client'

import { useState, useEffect } from 'react'
import { Loader2, X } from 'lucide-react'

export function ChatImage({ messageId }: { messageId: string }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [lightbox, setLightbox] = useState(false)

    useEffect(() => {
        let isMounted = true

        const loadImage = async () => {
            if (imageUrl || loading || error) return
            setLoading(true)

            try {
                const res = await fetch('/api/whatsapp/media/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message_id: messageId })
                })

                if (!res.ok) throw new Error('Falha no download da imagem')

                const { base64, mimetype } = await res.json()
                const dataUrl = `data:${mimetype || 'image/jpeg'};base64,${base64}`

                if (isMounted) setImageUrl(dataUrl)
            } catch (err) {
                console.error('Erro ao carregar imagem:', err)
                if (isMounted) setError(true)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadImage()

        return () => {
            isMounted = false
            // Object URL not needed for base64 image strings.
        }
    }, [messageId, imageUrl, loading, error])

    if (error) return <span className="text-xs italic text-red-400">⚠️ Imagem indisponível ou expirada</span>
    if (loading) return (
        <div className="w-[200px] h-[150px] rounded-lg bg-gray-200/50 animate-pulse flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={20} />
        </div>
    )
    if (!imageUrl) return null

    return (
        <div className="relative mt-1">
            <img
                src={imageUrl}
                alt="Imagem anexada"
                className="max-w-[250px] max-h-[250px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-black/5"
                onClick={() => setLightbox(true)}
            />

            {/* Modal Lightbox ao Clicar */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 transition-all"
                    onClick={() => setLightbox(false)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt="Imagem"
                        className="max-w-full rounded-md max-h-[80vh] object-contain"
                    />
                    <button
                        className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            setLightbox(false)
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>
            )}
        </div>
    )
}
