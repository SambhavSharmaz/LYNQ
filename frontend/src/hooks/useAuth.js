import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

// Initialize Firebase (ensure .env values are set)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null)

  // ✅ Generate unique Lynq ID
  const generateLynqId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: 8 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }

  // ✅ Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setUserData(null)
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', u.uid)
        const snap = await getDoc(userRef)
        let lynqId = snap.exists() ? snap.data()?.lynqId : null

        if (!lynqId) lynqId = generateLynqId()

        const profileData = {
          uid: u.uid,
          lynqId,
          displayName: u.displayName || u.email?.split('@')[0] || u.phoneNumber || 'User',
          email: u.email || null,
          phoneNumber: u.phoneNumber || null,
          photoURL: u.photoURL || null,
          updatedAt: serverTimestamp(),
          friends: snap.data()?.friends || [],
          friendRequests: {
            incoming: snap.data()?.friendRequests?.incoming || [],
            outgoing: snap.data()?.friendRequests?.outgoing || []
          }
        }

        await setDoc(userRef, profileData, { merge: true })

        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ ...u, ...docSnap.data() })
          } else {
            setUserData({ ...u, ...profileData })
          }
        })

        return () => unsubscribeUser()
      } catch (err) {
        console.error('Error setting up user profile:', err)
        setUserData(u)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // ✅ Initialize reCAPTCHA correctly
  const initRecaptcha = useCallback(() => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved'),
        'expired-callback': () => console.log('reCAPTCHA expired'),
      })
      setRecaptchaVerifier(verifier)
      return verifier
    }
    return recaptchaVerifier
  }, [recaptchaVerifier])

  // ✅ Authentication actions
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
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      return confirmation
    },

    verifyOTP: async (confirmationResult, otp) => {
      const result = await confirmationResult.confirm(otp)
      return result
    },

    linkPhoneNumber: async (phoneNumber) => {
      if (!auth.currentUser) throw new Error('No user logged in')
      const verifier = initRecaptcha()
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      return confirmation
    },

    signOut: async () => {
      await signOut(auth)
    }
  }), [initRecaptcha])

  return { user: userData, loading, ...actions }
}
