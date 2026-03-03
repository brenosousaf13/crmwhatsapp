'use client'

import { useChat } from './chat-context'
import { ConversationList } from './conversation-list/conversation-list'
import { ConversationView } from './conversation/conversation-view'
import { LeadPanel } from './lead-panel/lead-panel'

export function ChatPage() {
    const { isLeadPanelOpen, mobileViewIndex } = useChat()

    // Web layout: 100% width, flex row. 
    // Col 1 is 320px fixed (border right). 
    // Col 2 is flex-1. 
    // Col 3 is 320px fixed (border left) if isLeadPanelOpen.

    // Mobile layout: only show the active view index
    // index 0 = list, index 1 = chat, index 2 = panel

    return (
        <div className="flex w-full h-full relative overflow-hidden">
            {/* Column 1: List */}
            <div className={`
                w-full sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px] 
                border-r border-gray-200 bg-white flex flex-col
                ${mobileViewIndex !== 0 ? 'hidden sm:flex' : 'flex'}
            `}>
                <ConversationList />
            </div>

            {/* Column 2: Active Conversation */}
            <div className={`
                flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50 relative
                ${mobileViewIndex !== 1 ? 'hidden sm:flex' : 'flex'}
            `}>
                <ConversationView />
            </div>

            {/* Column 3: Lead Panel */}
            {isLeadPanelOpen && (
                <div className={`
                    w-full sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px] 
                    border-l border-gray-200 bg-white flex flex-col
                    ${mobileViewIndex !== 2 ? 'hidden sm:flex' : 'flex'}
                    absolute sm:relative inset-0 z-50
                `}>
                    <LeadPanel />
                </div>
            )}
        </div>
    )
}
