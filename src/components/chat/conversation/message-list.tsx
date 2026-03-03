'use client'

import { useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useChat } from '../chat-context'
import { useMessages } from '@/hooks/chat/use-messages'
import { Check, CheckCheck, File, Image as ImageIcon, Mic, Video, Bot } from 'lucide-react'
import { AudioPlayer } from '../AudioPlayer'
import { ChatImage } from '../ChatImage'
import { Loader2 } from 'lucide-react'

function formatMessageTime(dateString: string) {
    if (!dateString) return ''
    return format(new Date(dateString), 'HH:mm')
}

function formatDateSeparator(dateString: string) {
    const date = new Date(dateString)
    if (isToday(date)) return 'Hoje'
    if (isYesterday(date)) return 'Ontem'
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function MessageList() {
    const { selectedLeadId } = useChat()
    const { data: messages, isLoading } = useMessages(selectedLeadId)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        }

        // Scroll on new messages
        scrollToBottom()

        // Handle async media load layouts pushing the scroll
        window.addEventListener('chat-scroll-to-bottom', scrollToBottom)
        return () => window.removeEventListener('chat-scroll-to-bottom', scrollToBottom)
    }, [messages])

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#E5DDD5] relative">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500 z-10" />
            </div>
        )
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#E5DDD5] relative">
                <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                    style={{
                        backgroundImage: 'url("https://w0.peakpx.com/wallpaper/726/468/HD-wallpaper-whatsapp-background-theme-pattern-texture.jpg")',
                        backgroundSize: '400px'
                    }}
                />
                <div className="bg-[#D9FDD3] px-4 py-2 rounded-lg shadow-sm text-sm text-gray-700 z-10 max-w-sm text-center">
                    Envie uma mensagem para iniciar a conversa.
                </div>
            </div>
        )
    }

    let lastDateStr = ''

    return (
        <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2 relative bg-[#E5DDD5]"
        >
            <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                style={{
                    backgroundImage: 'url("https://w0.peakpx.com/wallpaper/726/468/HD-wallpaper-whatsapp-background-theme-pattern-texture.jpg")',
                    backgroundSize: '400px'
                }}
            />

            <div className="flex-1" /> {/* Spacer empurra mensagens curtas pro fundo */}
            <div className="flex flex-col gap-2 w-full">
                {messages.map((msg) => {
                    const msgDateStr = new Date(msg.timestamp).toDateString()
                    const showDateSeparator = msgDateStr !== lastDateStr
                    if (showDateSeparator) lastDateStr = msgDateStr

                    const isOut = msg.direcao === 'saida'
                    const statusIconColor = msg.lida ? 'text-blue-500' : 'text-gray-400'

                    return (
                        <div key={msg.id} className="flex flex-col z-10 w-full">
                            {showDateSeparator && (
                                <div className="flex justify-center my-4">
                                    <span className="bg-[#DAE1E7] text-gray-600 text-xs px-3 py-1 rounded-md shadow-sm uppercase font-medium">
                                        {formatDateSeparator(msg.timestamp)}
                                    </span>
                                </div>
                            )}

                            <div className={`
                                flex max-w-[85%] sm:max-w-[70%]
                                ${isOut ? 'self-end' : 'self-start'}
                            `}>
                                <div className={`
                                    flex flex-col p-2 rounded-lg shadow-sm relative min-w-[80px]
                                    ${isOut
                                        ? 'bg-[#D9FDD3] rounded-tr-none'
                                        : 'bg-white rounded-tl-none'
                                    }
                                `}>
                                    {/* Media Rendering */}
                                    {msg.tipo !== 'texto' && (
                                        <div className="flex flex-col gap-1 mb-1 bg-black/5 p-2 rounded relative">
                                            <div className="flex z-10 items-center justify-between text-gray-600 gap-2">
                                                <div className="flex items-center gap-1">
                                                    {(msg.tipo === 'imagem' || msg.tipo === 'image') && <ImageIcon className="w-4 h-4" />}
                                                    {msg.tipo === 'audio' && <Mic className="w-4 h-4" />}
                                                    {msg.tipo === 'video' && <Video className="w-4 h-4" />}
                                                    {(msg.tipo === 'documento' || msg.tipo === 'document') && <File className="w-4 h-4" />}
                                                    <span className="text-sm font-medium italic capitalize">{msg.tipo}</span>
                                                </div>
                                            </div>

                                            {/* Audio Rendering */}
                                            {msg.tipo === 'audio' && msg.whatsapp_message_id && (
                                                <div className="mt-1 z-20">
                                                    <AudioPlayer messageId={msg.whatsapp_message_id} />
                                                </div>
                                            )}

                                            {/* Image Rendering */}
                                            {(msg.tipo === 'imagem' || msg.tipo === 'image') && msg.whatsapp_message_id && (
                                                <div className="mt-1 z-20">
                                                    <ChatImage messageId={msg.whatsapp_message_id} />
                                                </div>
                                            )}

                                            {/* Transcription Info Details */}
                                            {msg.media_transcription && (
                                                <div className="mt-2 text-xs text-gray-700 bg-white/50 p-2 rounded border border-black/5">
                                                    <div className="font-semibold mb-0.5 opacity-60">🧠 IA detectou:</div>
                                                    <p className="italic leading-snug">{msg.media_transcription}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    {msg.conteudo && msg.conteudo !== '[Mídia]' && (
                                        <span className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-snug pr-8 mt-1">
                                            {msg.conteudo}
                                        </span>
                                    )}

                                    {/* Time and Status ticks */}
                                    <div className={`
                                        text-[10px] text-gray-500 flex items-center gap-1 leading-none
                                        ${(!msg.conteudo && msg.tipo !== 'texto') ? 'mt-1 self-end' : 'absolute bottom-1.5 right-2'}
                                    `}>
                                        {msg.enviada_por_ia && <span title="Gerado pela IA"><Bot className="w-3.5 h-3.5 text-blue-500 mb-0.5" /></span>}
                                        {formatMessageTime(msg.timestamp)}
                                        {isOut && (
                                            msg.lida ? <CheckCheck className={`w-3.5 h-3.5 ${statusIconColor}`} /> : <Check className={`w-3.5 h-3.5 ${statusIconColor}`} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
