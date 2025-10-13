import { useCallback, useRef, useState, useEffect } from 'react'
import { socket } from '../lib/socket'
import { useAuth } from './useAuth'

export function useWebRTC() {
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [callType, setCallType] = useState(null) // 'video' or 'voice'
  const [callState, setCallState] = useState('idle') // 'idle', 'calling', 'receiving', 'connected'
  const [currentCall, setCurrentCall] = useState(null)

  const peerConnection = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close()
    }

    peerConnection.current = new RTCPeerConnection(iceServers)

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      console.log('Received remote stream')
      setRemoteStream(event.streams[0])
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && currentCall) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          callId: currentCall.id,
          to: currentCall.otherUserId
        })
      }
    }

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState
      console.log('Connection state:', state)
      
      if (state === 'connected') {
        setCallState('connected')
      } else if (state === 'disconnected' || state === 'failed') {
        endCall()
      }
    }

    return peerConnection.current
  }, [currentCall])

  // Get user media
  const getUserMedia = useCallback(async (video = true, audio = true) => {
    try {
      const constraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (error) {
      console.error('Error getting user media:', error)
      throw error
    }
  }, [])

  // Start a call
  const startCall = useCallback(async (targetUserId, type = 'video') => {
    try {
      setCallType(type)
      setCallState('calling')
      setIsCallActive(true)

      const stream = await getUserMedia(type === 'video', true)
      const pc = createPeerConnection()

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const callData = {
        id: Date.now().toString(),
        from: user.uid,
        to: targetUserId,
        type,
        offer,
        timestamp: Date.now()
      }

      setCurrentCall({
        id: callData.id,
        otherUserId: targetUserId,
        type,
        isInitiator: true
      })

      socket.emit('call-request', callData)
    } catch (error) {
      console.error('Error starting call:', error)
      setCallState('idle')
      setIsCallActive(false)
    }
  }, [user, getUserMedia, createPeerConnection])

  // Answer a call
  const answerCall = useCallback(async (callData) => {
    try {
      setCallType(callData.type)
      setCallState('connected')
      setIsCallActive(true)

      const stream = await getUserMedia(callData.type === 'video', true)
      const pc = createPeerConnection()

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      setCurrentCall({
        id: callData.id,
        otherUserId: callData.from,
        type: callData.type,
        isInitiator: false
      })

      // Set remote description and create answer
      await pc.setRemoteDescription(callData.offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('call-answer', {
        callId: callData.id,
        to: callData.from,
        answer
      })
    } catch (error) {
      console.error('Error answering call:', error)
      rejectCall(callData)
    }
  }, [getUserMedia, createPeerConnection])

  // Reject a call
  const rejectCall = useCallback((callData) => {
    socket.emit('call-reject', {
      callId: callData.id,
      to: callData.from
    })
    setCallState('idle')
    setIsCallActive(false)
  }, [])

  // End call
  const endCall = useCallback(() => {
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }

    // Clear remote stream
    setRemoteStream(null)

    // Emit call end event
    if (currentCall) {
      socket.emit('call-end', {
        callId: currentCall.id,
        to: currentCall.otherUserId
      })
    }

    // Reset state
    setIsCallActive(false)
    setCallState('idle')
    setCurrentCall(null)
    setCallType(null)
  }, [localStream, currentCall])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }, [localStream])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }, [localStream])

  // Socket event listeners
  useEffect(() => {
    const handleCallAnswer = async (data) => {
      if (peerConnection.current && currentCall?.id === data.callId) {
        await peerConnection.current.setRemoteDescription(data.answer)
        setCallState('connected')
      }
    }

    const handleCallReject = () => {
      setCallState('idle')
      setIsCallActive(false)
      endCall()
    }

    const handleCallEnd = () => {
      endCall()
    }

    const handleIceCandidate = async (data) => {
      if (peerConnection.current && currentCall?.id === data.callId) {
        await peerConnection.current.addIceCandidate(data.candidate)
      }
    }

    socket.on('call-answer', handleCallAnswer)
    socket.on('call-reject', handleCallReject)
    socket.on('call-end', handleCallEnd)
    socket.on('ice-candidate', handleIceCandidate)

    return () => {
      socket.off('call-answer', handleCallAnswer)
      socket.off('call-reject', handleCallReject)
      socket.off('call-end', handleCallEnd)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [currentCall, endCall])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  return {
    localStream,
    remoteStream,
    isCallActive,
    isVideoEnabled,
    isAudioEnabled,
    callType,
    callState,
    currentCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  }
}