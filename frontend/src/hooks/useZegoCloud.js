import { useState, useEffect, useRef, useCallback } from 'react'
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { useAuth } from './useAuth'

export function useZegoCloud() {
  const { user } = useAuth()
  const [localTracks, setLocalTracks] = useState({ videoTrack: null, audioTrack: null })
  const [remoteUsers, setRemoteUsers] = useState({})
  const [isCallActive, setIsCallActive] = useState(false)
  const [callType, setCallType] = useState('video')
  const [currentCall, setCurrentCall] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState({ audio: false, video: false })

  const zegoRef = useRef(null)
  const localVideoRef = useRef(null)
  const localStreamRef = useRef(null)

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
      console.error('Cannot start Zego call: user is null')
      setError('User not authenticated')
      return false
    }

    const zegoAppId = parseInt(import.meta.env.VITE_ZEGO_APP_ID)
    const zegoServerSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET
    
    console.log('🔍 Debug - Zego App ID:', zegoAppId ? `${zegoAppId}` : 'NOT FOUND')
    
    if (!zegoAppId || !zegoServerSecret) {
      console.error('Zego credentials not found in environment variables')
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

      // Initialize Zego Express Engine
      zegoRef.current = new ZegoExpressEngine(zegoAppId, zegoServerSecret)
      
      // Set up event listeners
      setupEventListeners()
      
      // Generate token (in production, this should be done on your backend)
      const token = zegoRef.current.generateToken04(
        zegoAppId,
        user.uid,
        zegoServerSecret,
        3600, // Token validity: 1 hour
        ''
      )

      // Login to room
      await zegoRef.current.loginRoom(channel, {
        userID: user.uid,
        userName: user.displayName || user.email || `User-${user.uid}`
      }, { userUpdate: true }, token)

      // Create and start local stream
      const localStream = await zegoRef.current.createStream({
        camera: {
          audio: true,
          video: type === 'video',
          videoQuality: 3 // HD
        }
      })

      localStreamRef.current = localStream
      
      // Display local video if it's a video call
      if (type === 'video' && localVideoRef.current) {
        const localVideo = localVideoRef.current
        localVideo.srcObject = localStream
        localVideo.muted = true
        localVideo.play()
      }

      // Start publishing stream
      const streamID = `${user.uid}_stream`
      await zegoRef.current.startPublishingStream(streamID, localStream)

      setLocalTracks({
        audioTrack: localStream.getAudioTracks()[0] || null,
        videoTrack: localStream.getVideoTracks()[0] || null
      })

      setCurrentCall({ channel, type })
      setIsLoading(false)
      return true
    } catch (err) {
      console.error('Zego call error:', err)
      setError(`Failed to start call: ${err.message}`)
      setIsLoading(false)
      endCall()
      return false
    }
  }, [user?.uid, user?.displayName, user?.email, checkMediaPermissions])

  // Set up event listeners
  const setupEventListeners = useCallback(() => {
    if (!zegoRef.current) return

    // Handle room user update
    zegoRef.current.on('roomUserUpdate', (roomID, updateType, userList) => {
      if (updateType === 'ADD') {
        userList.forEach(user => {
          console.log('User joined:', user)
        })
      } else if (updateType === 'DELETE') {
        userList.forEach(user => {
          console.log('User left:', user)
          setRemoteUsers(prev => {
            const copy = { ...prev }
            delete copy[user.userID]
            return copy
          })
        })
      }
    })

    // Handle remote stream added
    zegoRef.current.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
      if (updateType === 'ADD') {
        for (const stream of streamList) {
          try {
            const remoteStream = await zegoRef.current.startPlayingStream(stream.streamID)
            
            setRemoteUsers(prev => ({
              ...prev,
              [stream.user.userID]: {
                uid: stream.user.userID,
                userName: stream.user.userName,
                stream: remoteStream,
                streamID: stream.streamID
              }
            }))

            // Play remote video
            const remoteVideoElement = document.getElementById(`remote-${stream.user.userID}`)
            if (remoteVideoElement && remoteStream) {
              remoteVideoElement.srcObject = remoteStream
              remoteVideoElement.play()
            }
          } catch (error) {
            console.error('Failed to play remote stream:', error)
          }
        }
      } else if (updateType === 'DELETE') {
        streamList.forEach(stream => {
          zegoRef.current.stopPlayingStream(stream.streamID)
          setRemoteUsers(prev => {
            const copy = { ...prev }
            delete copy[stream.user.userID]
            return copy
          })
        })
      }
    })

    // Handle network quality
    zegoRef.current.on('publisherQualityUpdate', (streamID, stats) => {
      console.log('Publisher quality:', stats)
    })

    zegoRef.current.on('playerQualityUpdate', (streamID, stats) => {
      console.log('Player quality:', stats)
    })
  }, [])

  const endCall = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        // Stop local stream tracks
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }

      if (zegoRef.current) {
        // Stop publishing
        await zegoRef.current.stopPublishingStream()
        
        // Stop playing all remote streams
        Object.values(remoteUsers).forEach(user => {
          if (user.streamID) {
            zegoRef.current.stopPlayingStream(user.streamID)
          }
        })

        // Logout from room
        await zegoRef.current.logoutRoom()
        
        // Destroy engine
        zegoRef.current.destroyEngine()
        zegoRef.current = null
      }
    } catch (error) {
      console.error('Error ending call:', error)
    }

    setLocalTracks({ videoTrack: null, audioTrack: null })
    setRemoteUsers({})
    setIsCallActive(false)
    setCurrentCall(null)
    setCallType('video')
  }, [remoteUsers])

  const toggleAudio = useCallback(() => {
    if (localTracks.audioTrack) {
      const enabled = !localTracks.audioTrack.enabled
      localTracks.audioTrack.enabled = enabled
      
      if (zegoRef.current) {
        zegoRef.current.mutePublishStreamAudio(!enabled)
      }
    }
  }, [localTracks.audioTrack])

  const toggleVideo = useCallback(() => {
    if (localTracks.videoTrack) {
      const enabled = !localTracks.videoTrack.enabled
      localTracks.videoTrack.enabled = enabled
      
      if (zegoRef.current) {
        zegoRef.current.mutePublishStreamVideo(!enabled)
      }
    }
  }, [localTracks.videoTrack])

  useEffect(() => {
    return () => {
      // Cleanup function
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (zegoRef.current) {
        zegoRef.current.stopPublishingStream().catch(console.error)
        zegoRef.current.logoutRoom().catch(console.error)
        zegoRef.current.destroyEngine()
        zegoRef.current = null
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