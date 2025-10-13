import React from 'react'
import { motion } from 'framer-motion'

export default function TypingIndicator({ typingUsers, currentUserId }) {
  // Filter out current user and get active typers
  const activeTypers = typingUsers.filter(user => user.userId !== currentUserId && user.isTyping)
  
  if (activeTypers.length === 0) return null

  const getTypingText = () => {
    if (activeTypers.length === 1) {
      return `${activeTypers[0].userName || 'Someone'} is typing...`
    } else if (activeTypers.length === 2) {
      return `${activeTypers[0].userName} and ${activeTypers[1].userName} are typing...`
    } else {
      return `${activeTypers.length} people are typing...`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-white/70"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-brand-blue rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-brand-blue rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-brand-blue rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span>{getTypingText()}</span>
    </motion.div>
  )
}