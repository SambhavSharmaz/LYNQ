import React, { createContext, useContext } from 'react'
import { useChats } from '../hooks/useChats'

const ChatsContext = createContext(null)

export function ChatsProvider({ children }) {
  const chatState = useChats()
  return <ChatsContext.Provider value={chatState}>{children}</ChatsContext.Provider>
}

export function useChatsContext() {
  const context = useContext(ChatsContext)
  if (!context) throw new Error('useChatsContext must be used inside ChatsProvider')
  return context
}
