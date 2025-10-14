import { useState, useEffect, useRef, useCallback } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { useAuth } from './useAuth'

export function useAgoraRTC() {
  const { user } = useAuth()
  const [localTracks, setLocalTracks] = useState({ videoTrack: null, audioTrack: null })
  const [remoteUsers, setRemoteUsers] = useState({})
  const [isCallActive, setIsCallActive] = useState(false)
  const [callType, setCallType] = useState('video')
  const [currentCall, setCurrentCall] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState({ audio: false, video: false })

  const clientRef = useRef(null)
  const localVideoRef = useRef(null)

  // Check media permissions
  const checkMediaPermissions = useCallback(async (type = 'video') => {
    try {
      setError(null)
      const permissions = { audio: false, video: false }
      
      // Check audio permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        permissions.audio = true
      } catch (audioError) {
        console.warn('Audio permission denied:', audioError)
        setError('Microphone access is required for calls')
      }
      
      // Check video permission if it's a video call
      if (type === 'video') {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true })
          permissions.video = true
        } catch (videoError) {
          console.warn('Video permission denied:', videoError)
          if (type === 'video') {
            setError('Camera access is required for video calls')
          }
        }
      } else {
        permissions.video = true // Not needed for audio calls
      }
      
      setPermissionsGranted(permissions)
      return permissions
    } catch (error) {
      console.error('Permission check failed:', error)
      setError('Failed to check media permissions')
      return { audio: false, video: false }
    }
  }, [])

  const initCall = useCallback(async (channel, type = 'video') => {
    if (!user?.uid) {
      console.error('Cannot start Agora call: user is null')
      setError('User not authenticated')
      return false
    }

    if (!import.meta.env.VITE_AGORA_APP_ID) {
      console.error('Agora App ID not found in environment variables')
      setError('Video calling is not configured. Please check environment variables.')
      return false
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Check media permissions first
      const permissions = await checkMediaPermissions(type)
      if (!permissions.audio || (type === 'video' && !permissions.video)) {
        setIsLoading(false)
        return false
      }

      setCallType(type)
      setIsCallActive(true)

      // Initialize the AgoraRTC client
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      
      // Set up event listeners before joining
      setupEventListeners()
      
      // Join a channel
      await clientRef.current.join(
        import.meta.env.VITE_AGORA_APP_ID,
        channel,
        import.meta.env.VITE_AGORA_TEMP_TOKEN || null,
        user.uid
      )

      // Create local media tracks
      const { audioTrack, videoTrack } = await createLocalMediaTracks(type)
      
      // Display local video if it's a video call
      if (type === 'video' && videoTrack && localVideoRef.current) {
        videoTrack.play(localVideoRef.current)
      }
      
      // Publish local tracks
      const tracksToPublish = [audioTrack]
      if (videoTrack) tracksToPublish.push(videoTrack)
      await clientRef.current.publish(tracksToPublish)

      setCurrentCall({ channel, type })
      setIsLoading(false)
      return true
    } catch (err) {
      console.error('Agora call error:', err)
      setError(`Failed to start call: ${err.message}`)
      setIsLoading(false)
      endCall()
      return false
    }
  }, [user?.uid, checkMediaPermissions])

  // Create local audio and video tracks
  const createLocalMediaTracks = useCallback(async (type) => {
    try {
      let audioTrack = null
      let videoTrack = null
      
      // Create audio track
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        })
      } catch (audioError) {
        console.error('Failed to create audio track:', audioError)
        throw new Error('Failed to access microphone. Please check permissions.')
      }
      
      // Create video track if needed
      if (type === 'video') {
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_1",
          })
        } catch (videoError) {
          console.error('Failed to create video track:', videoError)
          // Clean up audio track if video fails
          if (audioTrack) {
            audioTrack.close()
          }
          throw new Error('Failed to access camera. Please check permissions.')
        }
      }
      
      const tracks = { audioTrack, videoTrack }
      setLocalTracks(tracks)
      return tracks
    } catch (error) {
      console.error('Failed to create local media tracks:', error)
      setError(error.message)
      throw error
    }
  }, [])


  // Set up event listeners
  const setupEventListeners = useCallback(() => {
    if (!clientRef.current) return

    // Handle user-published event
    clientRef.current.on('user-published', async (user, mediaType) => {
      try {
        // Subscribe to media streams
        await clientRef.current.subscribe(user, mediaType)
        
        setRemoteUsers(prev => ({ ...prev, [user.uid]: user }))
        
        if (mediaType === 'video') {
          // Display remote video
          const container = document.getElementById(`remote-${user.uid}`)
          if (container && user.videoTrack) {
            user.videoTrack.play(container)
          }
        }
        if (mediaType === 'audio' && user.audioTrack) {
          user.audioTrack.play()
        }
      } catch (error) {
        console.error('Failed to subscribe to user:', error)
      }
    })

    // Handle user-unpublished event
    clientRef.current.on('user-unpublished', (user) => {
      setRemoteUsers(prev => {
        const copy = { ...prev }
        delete copy[user.uid]
        return copy
      })
      
      // Remove remote player container
      const remotePlayerContainer = document.getElementById(`remote-${user.uid}`)
      if (remotePlayerContainer) {
        remotePlayerContainer.remove()
      }
    })

    // Handle user-left event
    clientRef.current.on('user-left', (user) => {
      setRemoteUsers(prev => {
        const copy = { ...prev }
        delete copy[user.uid]
        return copy
      })
    })
  }, [])


  const endCall = useCallback(async () => {
    if (localTracks.audioTrack) {
      localTracks.audioTrack.stop()
      localTracks.audioTrack.close()
    }
    if (localTracks.videoTrack) {
      localTracks.videoTrack.stop()
      localTracks.videoTrack.close()
    }

    if (clientRef.current) {
      await clientRef.current.leave()
      clientRef.current.removeAllListeners()
      clientRef.current = null
    }

    setLocalTracks({ videoTrack: null, audioTrack: null })
    setRemoteUsers({})
    setIsCallActive(false)
    setCurrentCall(null)
    setCallType('video')
  }, [localTracks.audioTrack, localTracks.videoTrack])

  const toggleAudio = useCallback(() => {
    if (localTracks.audioTrack) {
      localTracks.audioTrack.setEnabled(!localTracks.audioTrack.enabled)
    }
  }, [localTracks.audioTrack])

  const toggleVideo = useCallback(() => {
    if (localTracks.videoTrack) {
      localTracks.videoTrack.setEnabled(!localTracks.videoTrack.enabled)
    }
  }, [localTracks.videoTrack])

  useEffect(() => {
    return () => {
      // Cleanup function without dependencies
      if (localTracks.audioTrack) {
        localTracks.audioTrack.stop()
        localTracks.audioTrack.close()
      }
      if (localTracks.videoTrack) {
        localTracks.videoTrack.stop()
        localTracks.videoTrack.close()
      }
      if (clientRef.current) {
        clientRef.current.leave()
        clientRef.current.removeAllListeners()
        clientRef.current = null
      }
    }
  }, [])


  return {
    localVideoRef,
    localTracks,
    remoteUsers,
    isCallActive,
    callType,
    currentCall,
    error,
    isLoading,
    permissionsGranted,
    initCall,
    endCall,
    toggleAudio,
    toggleVideo,
    checkMediaPermissions
  }
}
