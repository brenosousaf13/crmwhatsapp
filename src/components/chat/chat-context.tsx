'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ConversationFilter = 'all' | 'unread' | 'mine'

interface ChatContextProps {
    selectedLeadId: string | null
    setSelectedLeadId: (id: string | null) => void
    isLeadPanelOpen: boolean
    setIsLeadPanelOpen: (open: boolean) => void
    filter: ConversationFilter
    setFilter: (f: ConversationFilter) => void
    searchQuery: string
    setSearchQuery: (q: string) => void
    // Mobile navigation state (0: list, 1: chat, 2: panel)
    mobileViewIndex: number
    setMobileViewIndex: (index: number) => void
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
    const [isLeadPanelOpen, setIsLeadPanelOpen] = useState(false)
    const [filter, setFilter] = useState<ConversationFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileViewIndex, setMobileViewIndex] = useState(0)

    return (
        <ChatContext.Provider
            value={{
                selectedLeadId,
                setSelectedLeadId: (id) => {
                    setSelectedLeadId(id)
                    // Auto-advance mobile view to chat when selecting a lead
                    if (id) setMobileViewIndex(1)
                },
                isLeadPanelOpen,
                setIsLeadPanelOpen,
                filter,
                setFilter,
                searchQuery,
                setSearchQuery,
                mobileViewIndex,
                setMobileViewIndex
            }}
        >
            {children}
        </ChatContext.Provider>
    )
}

export function useChat() {
    const context = useContext(ChatContext)
    if (!context) throw new Error('useChat must be used within ChatProvider')
    return context
}
