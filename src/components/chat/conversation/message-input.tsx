'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Paperclip, Smile, Send, Mic, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChat } from '../chat-context'
import { useOrganization } from '@/components/providers/organization-provider'
import { useQuickReplies, QuickReply } from '@/hooks/chat/use-quick-replies'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

export function MessageInput() {
    const { selectedLeadId } = useChat()
    const { organization } = useOrganization()
    const queryClient = useQueryClient()
    const { data: quickReplies } = useQuickReplies()

    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [showQuickReplies, setShowQuickReplies] = useState(false)
    const [quickReplyFilter, setQuickReplyFilter] = useState('')
    const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Adjust textarea height automatically
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }, [message])

    // Watch for "/" to trigger quick replies
    useEffect(() => {
        const lastWord = message.split(' ').pop() || ''
        if (lastWord.startsWith('/')) {
            setShowQuickReplies(true)
            setQuickReplyFilter(lastWord.slice(1).toLowerCase())
        } else {
            setShowQuickReplies(false)
        }
    }, [message])

    const filteredQuickReplies = (quickReplies || []).filter(qr =>
        qr.atalho.toLowerCase().includes(quickReplyFilter) ||
        qr.titulo.toLowerCase().includes(quickReplyFilter)
    )

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (showQuickReplies && filteredQuickReplies.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedQuickReplyIndex(prev => Math.min(prev + 1, filteredQuickReplies.length - 1))
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedQuickReplyIndex(prev => Math.max(prev - 1, 0))
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                insertQuickReply(filteredQuickReplies[selectedQuickReplyIndex])
                return
            }
            if (e.key === 'Escape') {
                setShowQuickReplies(false)
                return
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendText()
        }
    }

    const insertQuickReply = (qr: QuickReply) => {
        const words = message.split(' ')
        words.pop() // remove the word starting with '/'

        const newMsg = [...words, qr.conteudo].join(' ') + ' '
        setMessage(newMsg)
        setShowQuickReplies(false)

        if (textareaRef.current) {
            textareaRef.current.focus()
        }
    }

    const handleSendText = async () => {
        const text = message.trim()
        if (!text || !selectedLeadId || isSending) return

        setIsSending(true)
        // Limpar o campo imediatamente para UX responsiva
        setMessage('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        try {
            const response = await fetch('/api/whatsapp/send/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedLeadId,
                    text,
                }),
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                console.error('Erro ao enviar:', err)
                // Restaurar a mensagem no campo se falhou
                setMessage(text)
                alert(err.error || 'Erro ao enviar mensagem. Verifique a conexão do WhatsApp.')
            } else {
                // Mensagem enviada e salva com sucesso — atualizar a UI imediatamente
                queryClient.invalidateQueries({ queryKey: ['messages', organization?.id, selectedLeadId] })
                queryClient.invalidateQueries({ queryKey: ['conversations', organization?.id] })
            }
        } catch (error) {
            console.error('Failed to send text', error)
            setMessage(text)
            alert('Erro de rede ao enviar mensagem.')
        } finally {
            setIsSending(false)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onEmojiSelect = (emoji: any) => {
        setMessage(prev => prev + emoji.native)
    }

    return (
        <div ref={containerRef} className="bg-gray-100 p-3 flex items-end gap-2 border-t border-gray-200 z-10 relative">

            {/* Quick Replies Popup */}
            {showQuickReplies && filteredQuickReplies.length > 0 && (
                <div className="absolute bottom-full left-0 w-full md:w-96 md:left-4 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Respostas Rápidas</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-200" onClick={() => setShowQuickReplies(false)}>
                            <X className="w-3 h-3 text-gray-500" />
                        </Button>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredQuickReplies.map((qr, i) => (
                            <li
                                key={qr.id}
                                className={`px-4 py-2 cursor-pointer border-b border-gray-50 last:border-0
                                    ${i === selectedQuickReplyIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                `}
                                onClick={() => insertQuickReply(qr)}
                                onMouseEnter={() => setSelectedQuickReplyIndex(i)}
                            >
                                <div className="text-sm font-semibold text-gray-900">{qr.atalho} - {qr.titulo}</div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">{qr.conteudo}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions: Emoji & Attachment */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-10 w-10 shrink-0">
                        <Smile className="w-6 h-6" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-0 border-none shadow-none">
                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xl">
                        <Picker data={data} onEmojiSelect={onEmojiSelect} locale="pt" theme="light" />
                    </div>
                </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-10 w-10 shrink-0">
                <Paperclip className="w-5 h-5" />
            </Button>

            {/* Input Box */}
            <div className="flex-1 bg-white rounded-xl border border-gray-300 flex items-end px-4 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva uma mensagem (/ para atalhos)..."
                    className="w-full resize-none outline-none max-h-[120px] bg-transparent text-sm text-gray-900 placeholder:text-gray-400 py-0.5"
                    style={{ minHeight: '24px' }}
                />
            </div>

            {/* Send / Mic button */}
            {message.trim() ? (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSendText}
                    disabled={isSending}
                    className="h-10 w-10 shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm ml-1"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </Button>
            ) : (
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 h-10 w-10 shrink-0 ml-1">
                    <Mic className="w-6 h-6" />
                </Button>
            )}
        </div>
    )
}
