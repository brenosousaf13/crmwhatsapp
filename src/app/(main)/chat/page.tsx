'use client'

import { ChatProvider } from '@/components/chat/chat-context'
import { ChatPage } from '@/components/chat/chat-page'

export default function Page() {
  return (
    <ChatProvider>
      {/* 
              We use negative margins because the (main) layout has p-6 
              and we want the chat to fill the entire remaining screen 
              like a Whatsapp Web interface.
            */}
      <div className="-m-6 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex bg-white border-t border-gray-200">
        <ChatPage />
      </div>
    </ChatProvider>
  )
}
