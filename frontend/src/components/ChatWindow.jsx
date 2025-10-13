import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChatsContext } from '../context/ChatsContext'
import { useUsers } from '../hooks/useUsers'
import { usePresence } from '../hooks/usePresence'
import SmartReplies from './SmartReplies'
import TypingIndicator from './TypingIndicator'
import Picker from 'emoji-picker-react'
import { FiSmile } from 'react-icons/fi'
import { socket } from '../lib/socket'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatWindow() {
  const { user } = useAuth()
  const { activeChat, messages, sendMessage, indicateTyping } = useChatsContext()
  const { usersMap } = useUsers()
  const { startTyping, stopTyping } = usePresence()
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [typingTimeout, setTypingTimeout] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Last 10 messages for SmartReplies
  const lastMessages = useMemo(
    () =>
      messages.slice(-10).map((m) => ({
        role: m.senderId === user?.uid ? 'user' : 'model',
        text: m.text || (m.mediaType ? `[${m.mediaType}]` : ''),
      })),
    [messages, user?.uid]
  )

  // Current chat info
  const currentChatInfo = useMemo(() => {
    if (!activeChat) return null
    if (activeChat.isGroup) {
      return {
        name: activeChat.name || 'Group Chat',
        isGroup: true,
        memberCount: activeChat.members?.length || 0,
      }
    } else {
      const otherId = (activeChat.members || []).find((m) => m !== user?.uid)
      const otherUser = usersMap[otherId]
      return {
        name: otherUser?.displayName || otherUser?.email || 'Unknown User',
        email: otherUser?.email,
        isGroup: false,
        isOnline: otherUser?.isOnline || false,
        otherId,
      }
    }
  }, [activeChat, user?.uid, usersMap])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset state when chat changes
  useEffect(() => {
    setText('')
    setFile(null)
    setTypingUsers([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [activeChat?.id])

  // Socket listeners for typing indicators
  useEffect(() => {
    if (!activeChat?.id) return

    const handleTypingStart = (data) => {
      if (data.chatId === activeChat.id && data.userId !== user?.uid) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.userId === data.userId)
          if (existing) {
            return prev.map(u => 
              u.userId === data.userId 
                ? { ...u, isTyping: true, userName: data.userName }
                : u
            )
          }
          return [...prev, { userId: data.userId, userName: data.userName, isTyping: true }]
        })
      }
    }

    const handleTypingStop = (data) => {
      if (data.chatId === activeChat.id) {
        setTypingUsers(prev => 
          prev.map(u => 
            u.userId === data.userId 
              ? { ...u, isTyping: false }
              : u
          ).filter(u => u.isTyping)
        )
      }
    }

    socket.on('typing-start', handleTypingStart)
    socket.on('typing-stop', handleTypingStop)

    return () => {
      socket.off('typing-start', handleTypingStart)
      socket.off('typing-stop', handleTypingStop)
    }
  }, [activeChat?.id, user?.uid])

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

  // Cloudinary upload
  const uploadFileToCloudinary = async (file) => {
    if (!file) return null
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUD_UPLOAD_PRESET)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      setUploading(false)
      if (!data.secure_url) return null
      return { url: data.secure_url, type: file.type }
    } catch (err) {
      console.error('Cloudinary upload error:', err)
      setUploading(false)
      return null
    }
  }

  const onSend = async () => {
    if (!text.trim() && !file) return

    let media = null
    if (file) {
      media = await uploadFileToCloudinary(file)
      if (!media) return
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    await sendMessage(activeChat.id, text, media)
    setText('')
  }

  const addEmoji = (emojiObj) => setText((prev) => prev + emojiObj.emoji)

  return (
    <div className="h-full flex flex-col bg-[#0D1117] text-white font-[Inter]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0D1117]/80 backdrop-blur px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-white">{currentChatInfo?.name}</h2>
            {!currentChatInfo?.isGroup && (
              <div className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full shadow-lg ${
                    currentChatInfo?.isOnline 
                      ? 'bg-brand-neon animate-pulse shadow-brand-neon/50' 
                      : 'bg-red-500 shadow-red-500/50'
                  }`}
                  title={currentChatInfo?.isOnline ? 'Online' : 'Offline'}
                />
                <span className={`text-xs font-medium ${
                  currentChatInfo?.isOnline ? 'text-brand-neon' : 'text-red-400'
                }`}>
                  {currentChatInfo?.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/60">
            {currentChatInfo?.isGroup
              ? `${currentChatInfo.memberCount} member${currentChatInfo.memberCount !== 1 ? 's' : ''}`
              : currentChatInfo?.email}
          </p>
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
          messages.map((m) => {
            const isOwnMessage = m.senderId === user?.uid
            const sender = isOwnMessage ? user : usersMap[m.senderId]

            return (
              <div key={m.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm backdrop-blur ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-[#1D9BF0] to-blue-600 text-white rounded-br-md'
                      : 'bg-[#161B22] text-gray-100 border border-gray-700 rounded-bl-md'
                  }`}
                >
                  {!isOwnMessage && activeChat?.isGroup && (
                    <div className="text-xs text-[#1D9BF0]/70 mb-1 font-medium">
                      {sender?.displayName || sender?.email || 'Unknown'}
                    </div>
                  )}

                  {m.text && <div className="break-words leading-relaxed">{m.text}</div>}

                  {m.mediaUrl && (
                    <div className="mt-2">
                      {m.mediaType?.startsWith('image/') ? (
                        <img
                          src={m.mediaUrl}
                          alt="Shared media"
                          className="rounded-lg max-h-64 w-auto border border-gray-700"
                        />
                      ) : m.mediaType?.startsWith('video/') ? (
                        <video
                          src={m.mediaUrl}
                          controls
                          className="rounded-lg max-h-64 w-auto border border-gray-700"
                        />
                      ) : (
                        <a
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-[#1D9BF0] hover:text-blue-400"
                        >
                          📄 Download file
                        </a>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                    {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          <TypingIndicator 
            typingUsers={typingUsers} 
            currentUserId={user?.uid}
          />
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-[#0D1117]/80 p-4 space-y-3 backdrop-blur relative">
        <SmartReplies context={lastMessages} onPick={(s) => setText(s)} />

        {file && (
          <div className="flex items-center gap-2 p-2 bg-[#161B22] rounded-lg border border-gray-700">
            <span className="text-sm text-gray-300">📁 {file.name}</span>
            <button
              onClick={() => {
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50">
            <Picker onEmojiClick={addEmoji} />
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                
                // Handle typing indicators
                if (e.target.value.length > 0) {
                  startTyping(activeChat.id)
                  
                  // Clear existing timeout and set new one
                  if (typingTimeout) clearTimeout(typingTimeout)
                  const newTimeout = setTimeout(() => {
                    stopTyping(activeChat.id)
                  }, 2000)
                  setTypingTimeout(newTimeout)
                } else {
                  stopTyping(activeChat.id)
                  if (typingTimeout) clearTimeout(typingTimeout)
                }
              }}
              onBlur={() => {
                stopTyping(activeChat.id)
                if (typingTimeout) clearTimeout(typingTimeout)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  stopTyping(activeChat.id)
                  onSend()
                }
              }}
              placeholder={`Message ${currentChatInfo?.name || 'user'}...`}
              className="w-full bg-[#161B22] text-gray-100 border border-gray-700 rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent placeholder-gray-500"
              rows={text.split('\n').length || 1}
              style={{ maxHeight: '120px' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-12 bottom-3 p-1 hover:bg-[#1D9BF0]/20 rounded-full transition-colors"
              title="Attach file"
            >
              📎
            </button>

            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="absolute right-3 bottom-3 p-1 hover:bg-[#1D9BF0]/20 rounded-full transition-colors"
              title="Emoji/GIF"
            >
              <FiSmile size={20} />
            </button>
          </div>

          <button
            onClick={onSend}
            disabled={!text.trim() && !file}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
              text.trim() || file
                ? 'bg-[#1D9BF0] hover:bg-blue-500 text-white shadow-[0_0_10px_#1D9BF0]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {uploading ? 'Uploading...' : 'Send'}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        <div className="text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
