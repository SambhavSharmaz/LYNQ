import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -50, x: '-50%' }}
      className={`fixed top-4 left-1/2 z-50 max-w-md w-full mx-4 p-4 rounded-lg shadow-lg backdrop-blur border ${
        type === 'success' 
          ? 'bg-brand-neon/20 border-brand-neon/30 text-brand-neon' 
          : 'bg-red-500/20 border-red-500/30 text-red-400'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {type === 'success' ? '✅' : '❌'}
          </span>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button 
          onClick={onClose}
          className="text-white/60 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}