'use client'

import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useChat } from '../chat-context'
import { Image as ImageIcon, Mic, Video, File, CheckCheck, Bot, User, Clock } from 'lucide-react'

// Types based on the supabase schema joined
interface ConversationItemProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lead: any // Typing as any for quick map, will enforce later
}

function formatMessageTime(dateString: string) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isToday(date)) {
        return format(date, 'HH:mm')
    }
    if (isYesterday(date)) {
        return 'ontem'
    }
    if (isThisWeek(date)) {
        return format(date, 'eee', { locale: ptBR })
    }
    return format(date, 'dd/MM')
}

export function ConversationItem({ lead }: ConversationItemProps) {
    const { selectedLeadId, setSelectedLeadId } = useChat()

    const isSelected = selectedLeadId === lead.id
    const hasUnread = (lead.mensagens_nao_lidas || 0) > 0
    const isAiPaused = lead.ia_pausada

    // The joined messages is an array of 1 because we limited it in the query
    const lastMessage = lead.mensagens && lead.mensagens.length > 0 ? lead.mensagens[0] : null
    const timeDisplay = formatMessageTime(lead.ultima_mensagem_at || (lastMessage ? lastMessage.timestamp : lead.created_at))

    // Urgency logic based on last incoming message time
    // Same as Kanban logic
    let urgencyBorder = 'border-transparent'

    // If the last message was incoming and unread, calculate urgency
    if (lastMessage && lastMessage.direcao === 'entrada' && !lastMessage.lida) {
        const minutesWaiting = (Date.now() - new Date(lastMessage.timestamp).getTime()) / 60000
        if (minutesWaiting >= 30) {
            urgencyBorder = 'border-red-500'
        } else if (minutesWaiting >= 10) {
            urgencyBorder = 'border-yellow-500'
        } else {
            urgencyBorder = 'border-green-500'
        }
    } else {
        urgencyBorder = 'border-green-500' // Default to answered/green
    }

    const renderMessagePreview = () => {
        if (!lastMessage) return <span className="text-gray-400 italic">Nenhuma mensagem</span>

        const prefix = lastMessage.direcao === 'saida' ? 'Você: ' : ''
        const previewText = lastMessage.conteudo

        if (lastMessage.tipo === 'imagem') {
            return <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Imagem</span>
        }
        if (lastMessage.tipo === 'audio') {
            return <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Áudio</span>
        }
        if (lastMessage.tipo === 'video') {
            return <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo</span>
        }
        if (lastMessage.tipo === 'documento') {
            return <span className="flex items-center gap-1"><File className="w-3 h-3" /> Documento</span>
        }

        return (
            <span className="flex items-center gap-1 truncate text-xs">
                {lastMessage.direcao === 'saida' && (
                    <CheckCheck className={`w-3 h-3 ${lastMessage.lida ? 'text-blue-500' : 'text-gray-400'}`} />
                )}
                {prefix}{previewText}
            </span>
        )
    }

    const initials = lead.nome ? lead.nome.substring(0, 2).toUpperCase() : '??'

    return (
        <div
            onClick={() => setSelectedLeadId(lead.id)}
            className={`
                flex items-center gap-3 p-3 cursor-pointer border-b border-gray-100 transition-colors
                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
            `}
        >
            <div className={`relative flex-shrink-0 w-12 h-12 rounded-full border-2 ${urgencyBorder} p-0.5`}>
                <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                    {initials}
                </div>
                <div
                    className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100"
                    title={isAiPaused ? "Atendimento Humano (IA Pausada)" : "IA Ativa"}
                >
                    {isAiPaused ? (
                        <User className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                        <Bot className="w-3.5 h-3.5 text-blue-500" />
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                        <h4 className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {lead.nome || lead.telefone}
                        </h4>
                        {lead.followup_ativo && (
                            <span title="Follow-up Ativo">
                                <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" strokeWidth={2.5} />
                            </span>
                        )}
                    </div>
                    <span className={`text-[11px] whitespace-nowrap pl-2 ${hasUnread ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                        {timeDisplay}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className={`text-sm truncate pr-2 ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {renderMessagePreview()}
                    </div>
                    {hasUnread && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white leading-none">{lead.mensagens_nao_lidas}</span>
                        </div>
                    )}
                </div>

                {lead.etapas_kanban && (
                    <div className="mt-1">
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                                backgroundColor: `${lead.etapas_kanban.cor}20`,
                                color: lead.etapas_kanban.cor
                            }}
                        >
                            {lead.etapas_kanban.nome}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
