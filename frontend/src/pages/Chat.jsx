import React from 'react'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import { ChatsProvider } from '../context/ChatsContext'
import { usePresence } from '../hooks/usePresence'

function ChatContent() {
  // Initialize presence system for this user
  usePresence()
  
  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex-1 grid grid-cols-4 gap-0">
        <div className="col-span-1 border-r overflow-y-auto">
          <ChatList />
        </div>
        <div className="col-span-3 overflow-hidden">
          <ChatWindow />
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  return (
    <ChatsProvider>
      <ChatContent />
    </ChatsProvider>
  )
}
