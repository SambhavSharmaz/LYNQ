import { useEffect, useState, useMemo } from 'react'
import { auth, googleProvider, db, serverTimestamp } from '../lib/firebase'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null)

  // Generate unique lynqId
  const generateLynqId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      try {
        if (u) {
          const userDoc = doc(db, 'users', u.uid)
          const userSnap = await getDoc(userDoc)
          
          // Check if user already has a lynqId
          let lynqId = userSnap.data()?.lynqId
          if (!lynqId) {
            lynqId = generateLynqId()
          }
          
          const userData = {
            uid: u.uid,
            lynqId: lynqId,
            displayName: u.displayName || u.email?.split('@')[0] || u.phoneNumber || 'User',
            email: u.email || null,
            phoneNumber: u.phoneNumber || null,
            photoURL: u.photoURL || null,
            updatedAt: serverTimestamp(),
            friends: userSnap.data()?.friends || [],
            friendRequests: {
              incoming: userSnap.data()?.friendRequests?.incoming || [],
              outgoing: userSnap.data()?.friendRequests?.outgoing || []
            }
          }
          
          await setDoc(userDoc, userData, { merge: true })
          
          // Listen to real-time updates for this user's data
          const unsubUser = onSnapshot(userDoc, (doc) => {
            if (doc.exists()) {
              const firestoreData = doc.data()
              setUserData({
                ...u,
                ...firestoreData
              })
            } else {
              setUserData({
                ...u,
                ...userData,
                lynqId: lynqId
              })
            }
          })
          
          // Store the unsubscribe function for cleanup
          return () => unsubUser()
        } else {
          setUserData(null)
        }
      } catch (e) {
        console.warn('Failed to persist user profile', e)
        setUserData(u)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  // Initialize recaptcha verifier
  const initRecaptcha = useCallback(() => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved')
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired')
        }
      })
      setRecaptchaVerifier(verifier)
      return verifier
    }
    return recaptchaVerifier
  }, [recaptchaVerifier])

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
    phoneSignIn: async (phoneNumber) => {
      const verifier = initRecaptcha()
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      return confirmationResult
    },
    verifyOTP: async (confirmationResult, otp) => {
      const result = await confirmationResult.confirm(otp)
      return result
    },
    linkPhoneNumber: async (phoneNumber) => {
      if (!auth.currentUser) throw new Error('No user logged in')
      const verifier = initRecaptcha()
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      return confirmationResult
    },
    signOut: async () => { await signOut(auth) }
  }), [initRecaptcha])

  // Return the merged user data that includes lynqId
  return { user: userData, loading, ...actions }
}
