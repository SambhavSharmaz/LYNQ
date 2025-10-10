import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'

export default function Login() {
  const { googleSignIn, emailSignIn, emailSignUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  return (
    <div className="h-full relative grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm card p-8 space-y-5"
      >
        <div className="flex items-center gap-3 justify-center">
          <img src="/Logo.jpg" alt="Lynq" className="w-8 h-8 rounded-md shadow-glow animate-float" />
          <h1 className="text-3xl font-display bg-gradient-to-r from-brand-blue to-brand-neon bg-clip-text text-transparent">Lynq</h1>
        </div>

        <button onClick={googleSignIn} className="btn btn-ghost border border-white/10 hover:border-white/20 w-full">
          Continue with Google
        </button>

        <div className="text-center text-xs text-white/60">or</div>

        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Display name (for sign up)" className="input" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="input" />

        <div className="flex gap-2">
          <button onClick={()=>emailSignIn(email, password)} className="btn btn-primary flex-1">Sign in</button>
          <button onClick={()=>emailSignUp(email, password, name)} className="btn flex-1 border border-white/10 hover:border-white/20">Sign up</button>
        </div>
      </motion.div>
    </div>
  )
}
