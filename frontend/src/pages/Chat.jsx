import React, { useState } from 'react'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import DebugInfo from '../components/DebugInfo'
import { useChats } from '../hooks/useChats'

export default function Chat() {
  const [showDebug, setShowDebug] = useState(false)
  const { activeChat } = useChats()
  
  // Simple console log to see if page re-renders
  console.log('🔥 Chat page RENDER - activeChat ID:', activeChat?.id)
  
  console.log('🔥 Chat page - activeChat full details:', {
    id: activeChat?.id,
    exists: !!activeChat,
    key: `chat-${activeChat?.id}`,
    object: activeChat
  })

  return (
    <div className="h-full flex flex-col">
      <Header />
      
      {/* Debug Toggle */}
      <div className="px-4 py-2 bg-yellow-50 border-b flex justify-between items-center">
        <span className="text-sm text-yellow-700">
          🔧 Debug mode for troubleshooting chat issues
        </span>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
      </div>
      
      <div className="flex-1 grid grid-cols-4 gap-0">
        <div className="col-span-1 border-r overflow-y-auto">
          <ChatList />
          {showDebug && <DebugInfo />}
        </div>
        <div className="col-span-3 overflow-hidden">
          <ChatWindow key={activeChat?.id || 'no-chat'} />
        </div>
      </div>
    </div>
  )
}
