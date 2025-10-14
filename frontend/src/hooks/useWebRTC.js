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
  const [callType, setCallType] = useState(null)
  const [callState, setCallState] = useState('idle') // 'idle', 'calling', 'receiving', 'connected'
  const [currentCall, setCurrentCall] = useState(null)

  const peerConnection = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  // Initialize peer connection
  const createPeerConnection = useCallback((otherUserId) => {
    if (peerConnection.current) {
      peerConnection.current.close()
    }

    peerConnection.current = new RTCPeerConnection(iceServers)

    // Handle remote stream
    const remote = new MediaStream()
    setRemoteStream(remote)
    peerConnection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remote.addTrack(track))
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote
      }
    }

    // ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && currentCall) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          callId: currentCall.id,
          to: otherUserId
        })
      }
    }

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState
      if (state === 'connected') setCallState('connected')
      else if (state === 'failed') endCall()
    }

    return peerConnection.current
  }, [currentCall])

  // Get user media
  const getUserMedia = useCallback(async (video = true, audio = true) => {
    try {
      const constraints = {
        video: video ? { width: 1280, height: 720, frameRate: 30 } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      return stream
    } catch (err) {
      console.error('Error accessing media devices:', err)
      throw err
    }
  }, [])

  // Start call
  const startCall = useCallback(async (targetUserId, type = 'video') => {
    setCallType(type)
    setCallState('calling')
    setIsCallActive(true) // open UI immediately

    try {
      const stream = await getUserMedia(type === 'video', true)
      const pc = createPeerConnection(targetUserId)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

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

      setCurrentCall({ id: callData.id, otherUserId: targetUserId, type, isInitiator: true })
      socket.emit('call-request', callData)

      // Timeout if no answer
      setTimeout(() => {
        if (callState === 'calling') endCall()
      }, 30000)
    } catch (err) {
      console.error('Error starting call:', err)
      endCall()
    }
  }, [user, getUserMedia, createPeerConnection, callState])

  // Answer call
  const answerCall = useCallback(async (callData) => {
    setCallType(callData.type)
    setCallState('connected')
    setIsCallActive(true)

    try {
      const stream = await getUserMedia(callData.type === 'video', true)
      const pc = createPeerConnection(callData.from)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('call-answer', { callId: callData.id, to: callData.from, answer })
      setCurrentCall({ id: callData.id, otherUserId: callData.from, type: callData.type, isInitiator: false })
    } catch (err) {
      console.error('Error answering call:', err)
      rejectCall(callData)
    }
  }, [getUserMedia, createPeerConnection])

  const rejectCall = useCallback((callData) => {
    socket.emit('call-reject', { callId: callData.id, to: callData.from })
    setCallState('idle')
    setIsCallActive(false)
  }, [])

  const endCall = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (localStream) localStream.getTracks().forEach(t => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
    if (currentCall) socket.emit('call-end', { callId: currentCall.id, to: currentCall.otherUserId })
    setCallState('idle')
    setIsCallActive(false)
    setCallType(null)
    setCurrentCall(null)
  }, [localStream, currentCall])

  const toggleVideo = useCallback(() => {
    if (!localStream) return
    const track = localStream.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsVideoEnabled(track.enabled)
    }
  }, [localStream])

  const toggleAudio = useCallback(() => {
    if (!localStream) return
    const track = localStream.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsAudioEnabled(track.enabled)
    }
  }, [localStream])

  // Socket listeners
  useEffect(() => {
    const handleAnswer = async (data) => {
      if (peerConnection.current && currentCall?.id === data.callId) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer))
        setCallState('connected')
      }
    }
    const handleReject = () => endCall()
    const handleEnd = () => endCall()
    const handleIce = async (data) => {
      if (peerConnection.current && currentCall?.id === data.callId) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    }

    socket.on('call-answer', handleAnswer)
    socket.on('call-reject', handleReject)
    socket.on('call-end', handleEnd)
    socket.on('ice-candidate', handleIce)

    return () => {
      socket.off('call-answer', handleAnswer)
      socket.off('call-reject', handleReject)
      socket.off('call-end', handleEnd)
      socket.off('ice-candidate', handleIce)
    }
  }, [currentCall, endCall])

  useEffect(() => {
    return () => endCall()
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
