'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type ViewMode = 'kanban' | 'list'

interface KanbanContextData {
    searchQuery: string
    setSearchQuery: (query: string) => void
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
}

const KanbanContext = createContext<KanbanContextData | undefined>(undefined)

export function KanbanProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<ViewMode>('kanban')

    return (
        <KanbanContext.Provider value={{ searchQuery, setSearchQuery, viewMode, setViewMode }}>
            {children}
        </KanbanContext.Provider>
    )
}

export function useKanbanContext() {
    const context = useContext(KanbanContext)
    if (context === undefined) {
        throw new Error('useKanbanContext must be used within a KanbanProvider')
    }
    return context
}
