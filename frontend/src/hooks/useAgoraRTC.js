import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-sdk-ng'
import { useAuth } from './useAuth'

export function useAgoraRTC() {
  const { user } = useAuth()
  const [localTracks, setLocalTracks] = useState({ videoTrack: null, audioTrack: null })
  const [remoteUsers, setRemoteUsers] = useState({})
  const [isCallActive, setIsCallActive] = useState(false)
  const [callType, setCallType] = useState('video')
  const [currentCall, setCurrentCall] = useState(null)

  const clientRef = useRef(null)
  const localVideoRef = useRef(null)

  // Start call or join channel
  const initCall = useCallback(async (channel, type = 'video') => {
    try {
      setCallType(type)
      setIsCallActive(true)

      // Create Agora client
      clientRef.current = createClient({ mode: 'rtc', codec: 'vp8' })
      await clientRef.current.join(
        import.meta.env.VITE_AGORA_APP_ID, // Agora App ID
        channel,
        import.meta.env.VITE_AGORA_TEMP_TOKEN || null, // Token if App Cert enabled
        user.uid
      )

      // Create local tracks
      const [microphoneTrack, cameraTrack] = await createMicrophoneAndCameraTracks(
        true,
        type === 'video'
      )
      setLocalTracks({ audioTrack: microphoneTrack, videoTrack: cameraTrack })

      // Play local video
      if (type === 'video' && localVideoRef.current) {
        cameraTrack.play(localVideoRef.current)
      }

      // Publish tracks
      await clientRef.current.publish([microphoneTrack, cameraTrack])

      // Remote users events
      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType)
        setRemoteUsers(prev => ({ ...prev, [user.uid]: user }))
        if (mediaType === 'video') {
          const container = document.getElementById(`remote-${user.uid}`)
          if (container) user.videoTrack.play(container)
        }
      })

      clientRef.current.on('user-unpublished', user => {
        setRemoteUsers(prev => {
          const copy = { ...prev }
          delete copy[user.uid]
          return copy
        })
      })

      setCurrentCall({ channel, type })
    } catch (err) {
      console.error('Agora call error:', err)
      endCall()
    }
  }, [user.uid])

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
  }, [localTracks])

  const toggleAudio = useCallback(() => {
    if (localTracks.audioTrack) {
      localTracks.audioTrack.setEnabled(!localTracks.audioTrack.enabled)
    }
  }, [localTracks])

  const toggleVideo = useCallback(() => {
    if (localTracks.videoTrack) {
      localTracks.videoTrack.setEnabled(!localTracks.videoTrack.enabled)
    }
  }, [localTracks])

  useEffect(() => {
    return () => endCall()
  }, [endCall])

  return {
    localVideoRef,
    localTracks,
    remoteUsers,
    isCallActive,
    callType,
    currentCall,
    initCall,
    endCall,
    toggleAudio,
    toggleVideo
  }
}
