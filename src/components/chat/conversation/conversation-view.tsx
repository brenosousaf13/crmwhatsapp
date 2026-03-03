'use client'

import { useChat } from '../chat-context'
import { MessageCircle } from 'lucide-react'
import { ConversationHeader } from './conversation-header'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'

export function ConversationView() {
    const { selectedLeadId } = useChat()

    if (!selectedLeadId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Selecione uma conversa</h3>
                <p className="text-sm">para começar a atender</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#E5DDD5]">
            <ConversationHeader />
            <MessageList />
            <MessageInput />
        </div>
    )
}
