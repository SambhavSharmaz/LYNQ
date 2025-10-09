import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export function useUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.uid, u])), [users])

  return { users, usersMap }
}
