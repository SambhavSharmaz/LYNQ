import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { user, signOut } = useAuth()
  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="font-semibold">Lynq</div>
      <div className="flex items-center gap-3">
        {user?.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full"/>}
        <div className="text-sm">{user?.displayName || user?.email}</div>
        <button onClick={signOut} className="text-sm text-red-600">Sign out</button>
      </div>
    </div>
  )
}
