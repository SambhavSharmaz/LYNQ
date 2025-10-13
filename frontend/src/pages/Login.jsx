import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'

export default function Login() {
  const { googleSignIn, emailSignIn, emailSignUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  return (
    <div className="h-screen bg-brand-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl p-10 shadow-xl space-y-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src="/Logo.jpg" alt="Lynq" className="w-12 h-12 rounded-md shadow-glow animate-float" />
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-brand-blue to-brand-neon bg-clip-text text-transparent">
            Lynq
          </h1>
        </div>

        {/* Google Sign In */}
        <button 
          onClick={googleSignIn} 
          className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-white/20 hover:border-white/40 bg-white/10 backdrop-blur transition-colors text-white font-medium"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5"/>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="flex-1 border-t border-white/20"></span>
          or
          <span className="flex-1 border-t border-white/20"></span>
        </div>

        {/* Input fields */}
        <div className="space-y-3">
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Display name (for sign up)" 
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
          />
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
          />
          <input 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
            type="password" 
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
          />
        </div>

        {/* Sign in / Sign up buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => emailSignIn(email, password)} 
            className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue/90 rounded-xl text-white font-medium transition"
          >
            Sign In
          </button>
          <button 
            onClick={() => emailSignUp(email, password, name)} 
            className="flex-1 py-3 border border-white/20 hover:border-white/40 rounded-xl text-white font-medium transition"
          >
            Sign Up
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/50 mt-2">
          By signing in, you agree to our Terms & Privacy Policy.
        </p>
      </motion.div>
    </div>
  )
}
