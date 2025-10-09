import { useEffect, useState, useMemo } from 'react'
import { auth, googleProvider, db, serverTimestamp } from '../lib/firebase'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      try {
        if (u) {
          const userDoc = doc(db, 'users', u.uid)
          await setDoc(userDoc, {
            uid: u.uid,
            displayName: u.displayName || u.email?.split('@')[0] || 'User',
            email: u.email || null,
            photoURL: u.photoURL || null,
            updatedAt: serverTimestamp(),
          }, { merge: true })
        }
      } catch (e) {
        console.warn('Failed to persist user profile', e)
      }
    })
    return () => unsub()
  }, [])

  const actions = useMemo(() => ({
    googleSignIn: async () => {
      await signInWithPopup(auth, googleProvider)
    },
    emailSignIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    emailSignUp: async (email, password, displayName) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) await updateProfile(cred.user, { displayName })
    },
    signOut: async () => { await signOut(auth) }
  }), [])

  return { user, loading, ...actions }
}
