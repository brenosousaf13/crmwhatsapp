'use client'

import { useChat } from '../chat-context'
import { Search, Plus, Filter, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConversations } from '@/hooks/chat/use-conversations'
import { ConversationItem } from './conversation-item'
import { useMemo } from 'react'

export function ConversationList() {
    const { filter, searchQuery } = useChat()
    const { data: leads, isLoading } = useConversations()

    const filteredLeads = useMemo(() => {
        if (!leads) return []

        let filtered = leads

        // 1. Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            filtered = filtered.filter(l =>
                l.nome?.toLowerCase().includes(q) ||
                l.telefone?.includes(q) ||
                (l.mensagens && l.mensagens[0] && l.mensagens[0].conteudo?.toLowerCase().includes(q))
            )
        }

        // 2. Tab filters
        if (filter === 'unread') {
            filtered = filtered.filter(l => l.mensagens_nao_lidas > 0)
        } else if (filter === 'mine') {
            // Need actual user ID here if user is logged in
            // For now, this requires the current user's profile ID comparing with l.usuario_id
            // We will skip user match here and do it later once we get user session, 
            // or just leave it returning empty/all for now.
        }

        return filtered
    }, [leads, searchQuery, filter])

    return (
        <div className="flex flex-col h-full bg-white">
            <ConversationListHeader />
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="p-8 flex justify-center text-sm text-gray-500 text-center">
                        {searchQuery || filter !== 'all'
                            ? 'Nenhuma conversa encontrada para os filtros atuais.'
                            : 'Nenhuma conversa disponível.'}
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <ConversationItem key={lead.id} lead={lead} />
                    ))
                )}
            </div>
        </div>
    )
}

function ConversationListHeader() {
    const { filter, setFilter, searchQuery, setSearchQuery } = useChat()

    return (
        <div className="flex flex-col gap-3 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    💬 Conversas
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex bg-gray-100 rounded-md p-1 gap-1">
                {(['all', 'unread', 'mine'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${filter === f
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        {f === 'all' ? 'Todas' : f === 'unread' ? 'Não lidas' : 'Minhas'}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Buscar conversa..."
                    className="pl-9 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white transition-colors h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    )
}
