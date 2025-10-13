import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { socket } from '../lib/socket'

export function useUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    
    // Listen for real-time user status changes via socket
    const handleUserStatusChange = (data) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === data.userId 
            ? { ...user, isOnline: data.isOnline }
            : user
        )
      )
    }
    
    socket.on('user-status-change', handleUserStatusChange)
    
    return () => {
      unsub()
      socket.off('user-status-change', handleUserStatusChange)
    }
  }, [])

  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.uid, u])), [users])

  return { users, usersMap }
}
