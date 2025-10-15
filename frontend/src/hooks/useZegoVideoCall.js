import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'

// Dynamically load Zego UIKit script
let zegoScriptPromise = null
const loadZegoScript = () => {
  if (zegoScriptPromise) {
    return zegoScriptPromise
  }
  
  if (window.ZegoUIKitPrebuilt) {
    return Promise.resolve(window.ZegoUIKitPrebuilt)
  }

  zegoScriptPromise = new Promise((resolve, reject) => {
    // Check if script is already loading
    const existingScript = document.querySelector('script[src="https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js"]')
    if (existingScript) {
      existingScript.onload = () => {
        resolve(window.ZegoUIKitPrebuilt)
      }
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js'
    script.onload = () => {
      if (window.ZegoUIKitPrebuilt) {
        resolve(window.ZegoUIKitPrebuilt)
      } else {
        reject(new Error('Failed to load Zego UIKit'))
      }
    }
    script.onerror = () => {
      zegoScriptPromise = null // Reset on error to allow retry
      reject(new Error('Failed to load Zego UIKit script'))
    }
    document.head.appendChild(script)
  })
  
  return zegoScriptPromise
}

export function useZegoVideoCall() {
  const { user } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [callType, setCallType] = useState('video')
  const [currentCall, setCurrentCall] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [zegoInstance, setZegoInstance] = useState(null)

  const callContainerRef = useRef(null)
  const zegoRef = useRef(null)

  // Zego configuration from environment variables
  const ZEGO_CONFIG = {
    appID: parseInt(import.meta.env.VITE_ZEGO_APP_ID) || 1063522204,
    serverSecret: import.meta.env.VITE_ZEGO_SERVER_SECRET || "2fd95ed00eb62e4de294701e3ab0dfc5"
  }

  const initCall = useCallback(async (roomID, type = 'video') => {
    if (!user?.uid) {
      console.error('Cannot start Zego call: user is null')
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)
      setCallType(type)
      
      // Set call as active immediately to prevent UI blocking
      setIsCallActive(true)
      setCurrentCall({ roomID, type })
      
      // Only show loading if script needs to be loaded
      const needsScriptLoading = !window.ZegoUIKitPrebuilt
      if (needsScriptLoading) {
        setIsLoading(true)
      }

      // Load Zego UIKit if not already loaded
      const ZegoUIKitPrebuilt = await loadZegoScript()
      
      // Script loaded - stop loading indicator to make UI interactive
      setIsLoading(false)

      // Generate user ID and name
      const userID = user.uid || Math.floor(Math.random() * 10000).toString()
      const userName = user.displayName || user.email || `User${userID}`

      // Generate Kit Token using the working configuration
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        ZEGO_CONFIG.appID,
        ZEGO_CONFIG.serverSecret,
        roomID,
        userID,
        userName
      )

      // Create Zego instance
      const zp = ZegoUIKitPrebuilt.create(kitToken)
      zegoRef.current = zp

      // Configure call settings based on type - use OneONoneCall for better 1:1 experience
      const callConfig = {
        container: callContainerRef.current,
        sharedLinks: [{
          name: 'Call link',
          url: `${window.location.origin}/call?roomID=${roomID}`,
        }],
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // Always use 1-on-1 for better UX
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: type === 'video',
        showMyCameraToggleButton: type === 'video',
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: type === 'video',
        showTextChat: false, // Disable to reduce UI clutter
        showUserList: false, // Not needed for 1:1 calls
        maxUsers: 2,
        layout: "Auto",
        showLayoutButton: false,
        showPinButton: false,
        showRemoveButton: false,
        
        // Callbacks
        onJoinRoom: () => {
          console.log('Successfully joined Zego room:', roomID)
        },
        onLeaveRoom: () => {
          console.log('Left Zego room')
          // Reset all states when leaving
          setTimeout(() => {
            setIsCallActive(false)
            setCurrentCall(null)
            setIsLoading(false)
            setError(null)
            zegoRef.current = null
          }, 100) // Small delay to ensure proper cleanup
        },
        onUserJoin: (users) => {
          console.log('Users joined:', users)
        },
        onUserLeave: (users) => {
          console.log('Users left:', users)
        },
        onError: (error) => {
          console.error('Zego room error:', error)
          setError(`Call error: ${error.message || 'Unknown error'}`)
          setIsLoading(false)
        }
      }

      // Join the room
      await zp.joinRoom(callConfig)
      
      return true

    } catch (err) {
      console.error('Zego call error:', err)
      setError(`Failed to start call: ${err.message}`)
      setIsLoading(false)
      endCall()
      return false
    }
  }, [user])

  const endCall = useCallback(async () => {
    try {
      console.log('Ending Zego call...')
      
      // Set loading to false immediately to unblock UI
      setIsLoading(false)
      
      if (zegoRef.current) {
        try {
          // Destroy the Zego instance
          await zegoRef.current.destroy()
        } catch (destroyError) {
          console.warn('Error destroying Zego instance:', destroyError)
        }
        zegoRef.current = null
      }

      // Reset all call states
      setIsCallActive(false)
      setCurrentCall(null)
      setCallType('video')
      setError(null)
      
      // Clear the container
      if (callContainerRef.current) {
        callContainerRef.current.innerHTML = ''
      }
      
      console.log('Zego call ended successfully')
    } catch (err) {
      console.error('Error ending Zego call:', err)
      // Still reset states even if there's an error
      setIsCallActive(false)
      setCurrentCall(null)
      setIsLoading(false)
      setError(null)
    }
  }, [callContainerRef])

  // Toggle audio (handled by Zego UI automatically)
  const toggleAudio = useCallback(() => {
    // Zego UIKit handles this through its built-in controls
    console.log('Audio toggle handled by Zego UIKit')
  }, [])

  // Toggle video (handled by Zego UI automatically)
  const toggleVideo = useCallback(() => {
    // Zego UIKit handles this through its built-in controls
    console.log('Video toggle handled by Zego UIKit')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Immediate cleanup without async to prevent memory leaks
      if (zegoRef.current) {
        try {
          zegoRef.current.destroy()
        } catch (error) {
          console.warn('Cleanup error:', error)
        }
        zegoRef.current = null
      }
    }
  }, [])

  return {
    callContainerRef,
    isCallActive,
    callType,
    currentCall,
    error,
    isLoading,
    initCall,
    endCall,
    toggleAudio,
    toggleVideo,
    zegoInstance: zegoRef.current
  }
}