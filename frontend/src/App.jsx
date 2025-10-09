import React from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Chat from './pages/Chat'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="h-full grid place-items-center">Loading...</div>

  return user ? <Chat /> : <Login />
}
