'use client'

import { useChat } from '../chat-context'
import { X, GitCommit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConversations } from '@/hooks/chat/use-conversations'
import { useLeadHistory } from '@/app/(main)/kanban/_logic/use-kanban'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function LeadPanel() {
    const { setIsLeadPanelOpen, selectedLeadId, setMobileViewIndex } = useChat()
    const { data: leads } = useConversations()

    // Hooks specific to this lead
    const { data: events, isLoading: isLoadingHistory } = useLeadHistory(selectedLeadId || '')

    if (!selectedLeadId) return null

    const lead = leads?.find(l => l.id === selectedLeadId)
    if (!lead) return null

    const initials = lead.nome ? lead.nome.substring(0, 2).toUpperCase() : '??'

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-white">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        setIsLeadPanelOpen(false)
                        setMobileViewIndex(1) // back to chat on mobile
                    }}
                >
                    <X className="w-5 h-5 text-gray-500" />
                </Button>
                <h3 className="font-semibold text-gray-900">Detalhes do Lead</h3>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                {/* Lead Profile Base Info */}
                <div className="flex flex-col items-center p-6 border-b border-gray-200 bg-white shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-2xl mb-4 shadow-sm">
                        {initials}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 text-center">{lead.nome || 'Sem Nome'}</h2>
                    <p className="text-gray-500 mt-1">{lead.telefone}</p>

                    {lead.etapas_kanban && (
                        <div className="mt-3">
                            <span
                                className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
                                style={{ backgroundColor: lead.etapas_kanban.cor, color: '#fff' }}
                            >
                                {lead.etapas_kanban.nome}
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Informações</h4>
                        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-400">Nome</span>
                                <span className="text-sm font-medium text-gray-900">{lead.nome || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-400">Valor da Venda</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {lead.valor_venda
                                        ? `R$ ${lead.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                        : '-'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Histórico de Atividades</h4>
                        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                            {isLoadingHistory ? (
                                <div className="text-xs text-center text-gray-400 py-4">Carregando...</div>
                            ) : !events || events.length === 0 ? (
                                <div className="text-xs text-center text-gray-400 py-4">Nenhum evento registrado.</div>
                            ) : (
                                <div className="relative border-l border-gray-200 ml-2 pl-4 space-y-4 pb-2">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {events.map((event: any) => {
                                        const profile = Array.isArray(event.user_profiles) ? event.user_profiles[0] : event.user_profiles
                                        return (
                                            <div key={event.id} className="relative">
                                                <span className="absolute -left-[21px] top-1 p-0.5 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                                                    <GitCommit className="h-2.5 w-2.5 text-gray-400" />
                                                </span>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-medium text-gray-900 leading-snug">{event.descricao}</span>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                        <span>{profile?.nome || 'Sistema'}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(event.criado_em), "d MMM, HH:mm", { locale: ptBR })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
