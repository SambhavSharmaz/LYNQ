import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-16 sticky top-0 z-50 border-b border-white/10 bg-brand-dark/60 backdrop-blur-xl shadow-lg shadow-brand-neon/10 flex items-center justify-between px-6"
    >
      {/* Left Section: Logo + Title */}
      <div className="flex items-center gap-3">
        <motion.img
          src="/Logo.jpg"
          alt="Lynq"
          className="w-9 h-9 rounded-lg shadow-[0_0_12px_rgba(0,255,255,0.4)]"
          whileHover={{ scale: 1.1, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 250 }}
        />
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="font-display text-2xl tracking-wide bg-gradient-to-r from-brand-neon to-cyan-400 text-transparent bg-clip-text"
        >
          Lynq
        </motion.span>
      </div>

      {/* Right Section: User Info + Sign Out */}
      <div className="flex items-center gap-4">
        {user?.photoURL ? (
          <div className="relative">
            <motion.img
              src={user.photoURL}
              alt="User"
              className="w-9 h-9 rounded-full border border-white/10 object-cover"
              whileHover={{ scale: 1.1 }}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-brand-neon ring-2 ring-brand-dark animate-pulse" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">
            ?
          </div>
        )}

        <div className="text-sm text-white/80 font-medium">
          {user?.displayName || user?.email}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
        >
          <LogOut size={16} />
          Sign out
        </motion.button>
      </div>
    </motion.header>
  )
}
