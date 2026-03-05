'use client'

import { useChat } from '../chat-context'
import { ArrowLeft, PanelRightClose, PanelRightOpen, MoreVertical, PlayCircle, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleFollowupDialog } from './schedule-followup-dialog'
import { useConversations } from '@/hooks/chat/use-conversations'
import { createClient } from '@/lib/supabase/client'
import { useCallback } from 'react'

export function ConversationHeader() {
    const { selectedLeadId, setMobileViewIndex, isLeadPanelOpen, setIsLeadPanelOpen } = useChat()
    const { data: leads } = useConversations()
    const supabase = createClient()

    const lead = leads?.find(l => l.id === selectedLeadId)

    const handleToggleAi = useCallback(async () => {
        if (!lead) return
        const wasPaused = lead.ia_pausada
        await supabase
            .from('leads')
            .update({
                ia_pausada: !wasPaused,
                ia_pausada_por: !wasPaused ? 'humano' : null,
                ia_pausada_em: !wasPaused ? new Date().toISOString() : null
            })
            .eq('id', lead.id)
    }, [lead, supabase])

    if (!lead) return null

    const initials = lead.nome ? lead.nome.substring(0, 2).toUpperCase() : '??'

    return (
        <div className="bg-gray-100 flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                    onClick={() => setMobileViewIndex(0)}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <div
                    className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold cursor-pointer"
                    onClick={() => {
                        setIsLeadPanelOpen(true)
                        setMobileViewIndex(2)
                    }}
                >
                    {initials}
                </div>

                <div
                    className="flex flex-col cursor-pointer"
                    onClick={() => {
                        setIsLeadPanelOpen(true)
                        setMobileViewIndex(2)
                    }}
                >
                    <h3 className="font-semibold text-gray-900 leading-none">{lead.nome || lead.telefone}</h3>
                    {lead.etapas_kanban && (
                        <span className="text-xs mt-0.5 text-gray-500 flex items-center gap-1">
                            {lead.telefone} •
                            <span
                                className="px-1.5 py-0.5 rounded-full font-medium text-[9px] uppercase tracking-wider"
                                style={{ backgroundColor: `${lead.etapas_kanban.cor}20`, color: lead.etapas_kanban.cor }}
                            >
                                {lead.etapas_kanban.nome}
                            </span>
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                {lead && (
                    <Button
                        variant={lead.ia_pausada ? 'outline' : 'default'}
                        size="sm"
                        className={`h-8 px-2 text-xs hidden sm:flex ${lead.ia_pausada ? 'text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        onClick={handleToggleAi}
                    >
                        {lead.ia_pausada ? (
                            <><PlayCircle className="w-3.5 h-3.5 mr-1" /> Retomar IA</>
                        ) : (
                            <><PauseCircle className="w-3.5 h-3.5 mr-1" /> Pausar IA</>
                        )}
                    </Button>
                )}

                <ScheduleFollowupDialog leadId={lead.id} leadName={lead.nome || lead.telefone} />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        setIsLeadPanelOpen(!isLeadPanelOpen)
                        if (!isLeadPanelOpen) setMobileViewIndex(2)
                    }}
                    className={`hidden sm:flex ${isLeadPanelOpen ? 'bg-gray-200' : ''}`}
                    title={isLeadPanelOpen ? "Fechar detalhes" : "Ver detalhes"}
                >
                    {isLeadPanelOpen ? <PanelRightClose className="w-5 h-5 text-gray-600" /> : <PanelRightOpen className="w-5 h-5 text-gray-600" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
