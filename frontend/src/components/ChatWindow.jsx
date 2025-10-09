import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChats } from '../hooks/useChats'
import { useUsers } from '../hooks/useUsers'
import SmartReplies from './SmartReplies'

export default function ChatWindow() {
  console.log('🔥 ChatWindow function called')
  
  const { user } = useAuth()
  const { activeChat, messages, sendMessage, indicateTyping } = useChats()
  const { usersMap } = useUsers()
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  
  // Component mount/unmount debugging
  useEffect(() => {
    console.log('🔥 ChatWindow MOUNTED for chat:', activeChat?.id)
    return () => {
      console.log('🔥 ChatWindow UNMOUNTING for chat:', activeChat?.id)
    }
  }, [])
  
  // Track activeChat changes
  useEffect(() => {
    console.log('🔥 ChatWindow - activeChat changed to:', {
      id: activeChat?.id,
      timestamp: Date.now(),
      fullChat: activeChat
    })
  }, [activeChat?.id])
  
  // Debug logging
  console.log('🔥 ChatWindow render - activeChat (from PROP):', {
    id: activeChat?.id,
    isGroup: activeChat?.isGroup,
    members: activeChat?.members,
    messagesCount: messages.length,
    propReceived: !!activeChat
  })

  const lastMessages = useMemo(() => messages.slice(-10).map(m => ({
    role: m.senderId === user?.uid ? 'user' : 'model',
    text: m.text || (m.mediaType ? `[${m.mediaType}]` : '')
  })), [messages, user?.uid])

  // Get current chat information
  const currentChatInfo = useMemo(() => {
    console.log('🔥 ChatWindow - Calculating currentChatInfo for:', {
      activeChatId: activeChat?.id,
      isGroup: activeChat?.isGroup,
      members: activeChat?.members,
      userId: user?.uid
    })
    
    if (!activeChat) return null
    
    if (activeChat.isGroup) {
      const result = {
        name: activeChat.name || 'Group Chat',
        isGroup: true,
        memberCount: activeChat.members?.length || 0
      }
      console.log('🔥 ChatWindow - Group chat info:', result)
      return result
    } else {
      // Direct chat - find the other user
      const otherId = (activeChat.members || []).find(m => m !== user?.uid)
      const otherUser = usersMap[otherId]
      const result = {
        name: otherUser?.displayName || otherUser?.email || 'Unknown User',
        email: otherUser?.email,
        isGroup: false,
        isOnline: otherUser?.isOnline || false,
        otherId: otherId
      }
      console.log('🔥 ChatWindow - Direct chat info:', {
        ...result,
        otherUser: otherUser,
        allUsers: Object.keys(usersMap)
      })
      return result
    }
  }, [activeChat, user?.uid, usersMap])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset text and file when switching chats
  useEffect(() => {
    setText('')
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [activeChat?.id])

  if (!activeChat) {
    return (
      <div className="h-full grid place-items-center text-center text-gray-500">
        <div>
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Welcome to Lynq</h3>
          <p>Select a chat to start messaging or create a new conversation</p>
        </div>
      </div>
    )
  }

  const onSend = async () => {
    if (!text && !file) return
    const f = file
    setFile(null)
    fileInputRef.current && (fileInputRef.current.value = '')
    await sendMessage(activeChat.id, text, f)
    setText('')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">{currentChatInfo?.name}</h2>
            {!currentChatInfo?.isGroup && currentChatInfo?.isOnline && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
            )}
          </div>
          {currentChatInfo?.isGroup ? (
            <p className="text-sm text-gray-500">
              {currentChatInfo.memberCount} member{currentChatInfo.memberCount !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {currentChatInfo?.email}
              {currentChatInfo?.isOnline ? ' • Online' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Add more actions here if needed */}
          <button className="p-2 hover:bg-gray-100 rounded-full">
            📞
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            📹
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-3xl mb-2">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(m => {
            const isOwnMessage = m.senderId === user?.uid
            const sender = isOwnMessage ? user : usersMap[m.senderId]
            
            return (
              <div key={m.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                  isOwnMessage 
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-white border rounded-bl-md'
                }`}>
                  {/* Show sender name for group chats and non-own messages */}
                  {!isOwnMessage && activeChat?.isGroup && (
                    <div className="text-xs text-gray-500 mb-1 font-medium">
                      {sender?.displayName || sender?.email || 'Unknown'}
                    </div>
                  )}
                  
                  {m.text && <div className="break-words">{m.text}</div>}
                  
                  {m.mediaUrl && (
                    <div className="mt-2">
                      {m.mediaType?.startsWith('image/') ? (
                        <img 
                          src={m.mediaUrl} 
                          alt="Shared image" 
                          className="rounded-lg max-h-64 w-auto" 
                        />
                      ) : (
                        <a 
                          className={`underline hover:no-underline ${
                            isOwnMessage ? 'text-blue-100' : 'text-blue-600'
                          }`} 
                          href={m.mediaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          📄 Download file
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {m.createdAt?.toDate?.()?.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) || 'Sending...'}
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 space-y-3">
        <SmartReplies context={lastMessages} onPick={(s)=>setText(s)} />
        
        {/* File Preview */}
        {file && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">📁 {file.name}</span>
            <button 
              onClick={() => {
                setFile(null)
                fileInputRef.current && (fileInputRef.current.value = '')
              }}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value)
                indicateTyping(activeChat.id, true)
              }}
              onBlur={() => indicateTyping(activeChat.id, false)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              placeholder={`Message ${currentChatInfo?.name || 'user'}...`}
              className="w-full border rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={text.split('\n').length || 1}
              style={{ maxHeight: '120px' }}
            />
            
            {/* Emoji/Attach button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 bottom-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Attach file"
            >
              📎
            </button>
          </div>
          
          <button 
            onClick={onSend}
            disabled={!text.trim() && !file}
            className={`px-6 py-3 rounded-2xl font-medium transition-colors ${
              text.trim() || file
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Send
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            className="hidden" 
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
