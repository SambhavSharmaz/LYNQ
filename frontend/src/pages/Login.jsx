import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { googleSignIn, emailSignIn, emailSignUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  return (
    <div className="h-full grid place-items-center">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Lynq</h1>
        <button onClick={googleSignIn} className="w-full bg-black text-white py-2 rounded-md">Continue with Google</button>
        <div className="text-center text-sm text-gray-500">or</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Display name (for sign up)" className="w-full border rounded px-3 py-2" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded px-3 py-2" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2" />
        <div className="flex gap-2">
          <button onClick={()=>emailSignIn(email, password)} className="flex-1 bg-blue-600 text-white py-2 rounded-md">Sign in</button>
          <button onClick={()=>emailSignUp(email, password, name)} className="flex-1 bg-gray-200 py-2 rounded-md">Sign up</button>
        </div>
      </div>
    </div>
  )
}
