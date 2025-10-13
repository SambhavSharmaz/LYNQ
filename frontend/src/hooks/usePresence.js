import { useEffect, useCallback } from 'react'
import { db, auth } from '../lib/firebase'
import { doc, updateDoc, serverTimestamp, onDisconnect } from 'firebase/firestore'
import { socket } from '../lib/socket'

export function usePresence() {
  // Set user online when component mounts
  useEffect(() => {
    if (!auth.currentUser) return

    const setOnlineStatus = async (isOnline) => {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid)
        await updateDoc(userRef, {
          isOnline,
          lastSeen: serverTimestamp()
        })
      } catch (error) {
        console.warn('Failed to update online status:', error)
      }
    }

    // Set user online
    setOnlineStatus(true)

    // Set up socket connection for real-time presence
    socket.emit('user-online', { userId: auth.currentUser.uid })

    // Set user offline when leaving
    const handleBeforeUnload = () => {
      setOnlineStatus(false)
      socket.emit('user-offline', { userId: auth.currentUser.uid })
    }

    // Set user offline on window close/refresh
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Set user offline on page visibility change (mobile app backgrounding)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setOnlineStatus(false)
        socket.emit('user-offline', { userId: auth.currentUser.uid })
      } else if (document.visibilityState === 'visible') {
        setOnlineStatus(true)
        socket.emit('user-online', { userId: auth.currentUser.uid })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(true)
        socket.emit('user-heartbeat', { userId: auth.currentUser.uid })
      }
    }, 30000) // Every 30 seconds

    // Cleanup
    return () => {
      setOnlineStatus(false)
      socket.emit('user-offline', { userId: auth.currentUser.uid })
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(heartbeatInterval)
    }
  }, [auth.currentUser?.uid])

  // Typing indicator functions
  const startTyping = useCallback((chatId) => {
    if (!auth.currentUser) return
    socket.emit('typing-start', {
      chatId,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email
    })
  }, [])

  const stopTyping = useCallback((chatId) => {
    if (!auth.currentUser) return
    socket.emit('typing-stop', {
      chatId,
      userId: auth.currentUser.uid
    })
  }, [])

  return {
    startTyping,
    stopTyping
  }
}