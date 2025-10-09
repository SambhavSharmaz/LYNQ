// Firebase initialization and exports
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, serverTimestamp } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate required config early with a clear message (avoid logging secrets)
function validateFirebaseConfig(cfg) {
  const required = ['apiKey','authDomain','projectId','appId']
  const missing = required.filter(k => !cfg[k])
  if (missing.length) {
    const msg = `Missing Firebase config: ${missing.join(', ')}. For local dev, create frontend/.env with VITE_FIREBASE_* values from your Firebase Web App settings.`
    throw new Error(msg)
  }
  
  // Check for common placeholder values (not real Firebase values)
  const placeholders = {
    'apiKey': ['your_api_key_here'],
    'authDomain': ['your_project_id.firebaseapp.com'],
    'projectId': ['your_project_id'],
    'appId': ['your_app_id']
  }
  
  for (const [key, invalidValues] of Object.entries(placeholders)) {
    if (invalidValues.includes(cfg[key])) {
      throw new Error(`Firebase ${key} is still using placeholder value '${cfg[key]}'. Please update your .env file with actual Firebase configuration values.`)
    }
  }
}

try {
  validateFirebaseConfig(firebaseConfig)
} catch (error) {
  console.error('Firebase configuration error:', error.message)
  // You can display this error in your UI or handle it appropriately
  throw error
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize messaging without requesting permission immediately
let messaging = null
let messagingInitialized = false

// Function to request notification permission (should be called on user interaction)
export const requestNotificationPermission = async () => {
  try {
    if (!(await isSupported())) {
      console.log('FCM not supported in this browser')
      return null
    }

    if (!messaging) {
      messaging = getMessaging(app)
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      if (vapidKey) {
        const token = await getToken(messaging, { vapidKey })
        console.log('FCM Token:', token)
        return token
      }
    } else if (Notification.permission !== 'denied') {
      // Only request permission if not already denied
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
        if (vapidKey) {
          const token = await getToken(messaging, { vapidKey })
          console.log('FCM Token:', token)
          return token
        }
      }
    }
    return null
  } catch (error) {
    console.warn('Error requesting notification permission:', error)
    return null
  }
}

// Initialize messaging for receiving messages (without requesting permission)
export const initializeMessaging = async () => {
  if (messagingInitialized) return messaging
  
  try {
    if (!(await isSupported())) {
      console.log('FCM not supported in this browser')
      return null
    }

    messaging = getMessaging(app)
    
    // Set up foreground message listener
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload)
      // You can dispatch a custom event or use a callback here
      window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }))
    })
    
    messagingInitialized = true
    return messaging
  } catch (error) {
    console.warn('Error initializing messaging:', error)
    return null
  }
}

// Get messaging instance (without token)
export const getMessagingInstance = () => messaging

export { serverTimestamp }
