import { useState, useEffect, useCallback, useRef } from 'react'
import { socket } from '../lib/socket'
import { useAuth } from './useAuth'

export function useCallSignaling() {
  const { user } = useAuth()
  const [incomingCall, setIncomingCall] = useState(null)
  const [outgoingCall, setOutgoingCall] = useState(null)
  const [callState, setCallState] = useState('idle') // 'idle', 'calling', 'incoming', 'connected'
  
  const callTimeoutRef = useRef(null)
  const CALL_TIMEOUT = 30000 // 30 seconds

  // Initialize socket events
  useEffect(() => {
    if (!user?.uid) return

    // Join user to their personal room for receiving calls
    socket.emit('user-online', user.uid)

    // Handle incoming call
    socket.on('incoming-call', (callData) => {
      console.log('Incoming call received:', callData)
      setIncomingCall(callData)
      setCallState('incoming')
      
      // Auto-reject after timeout
      callTimeoutRef.current = setTimeout(() => {
        rejectCall(callData)
      }, CALL_TIMEOUT)
    })

    // Handle call accepted
    socket.on('call-accepted', (callData) => {
      console.log('Call accepted:', callData)
      clearTimeout(callTimeoutRef.current)
      setCallState('connected')
      setOutgoingCall(null)
    })

    // Handle call rejected
    socket.on('call-rejected', (callData) => {
      console.log('Call rejected:', callData)
      clearTimeout(callTimeoutRef.current)
      setCallState('idle')
      setOutgoingCall(null)
    })

    // Handle call ended
    socket.on('call-ended', (callData) => {
      console.log('Call ended:', callData)
      clearTimeout(callTimeoutRef.current)
      setCallState('idle')
      setIncomingCall(null)
      setOutgoingCall(null)
    })

    // Handle user offline
    socket.on('user-offline', (userId) => {
      if (incomingCall?.callerId === userId || outgoingCall?.recipientId === userId) {
        endCall()
      }
    })

    return () => {
      socket.off('incoming-call')
      socket.off('call-accepted')
      socket.off('call-rejected')
      socket.off('call-ended')
      socket.off('user-offline')
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
      }
    }
  }, [user?.uid, incomingCall?.callerId, outgoingCall?.recipientId])

  // Initiate a call
  const initiateCall = useCallback(async (recipientId, callType = 'video') => {
    if (!user?.uid || !recipientId) {
      console.error('Cannot initiate call: missing user or recipient ID')
      return false
    }

    const callData = {
      callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callerId: user.uid,
      callerName: user.displayName || user.email || 'Unknown',
      callerAvatar: user.photoURL || null,
      recipientId,
      type: callType,
      channel: `channel_${user.uid}_${recipientId}_${Date.now()}`,
      timestamp: Date.now()
    }

    console.log('Initiating call:', callData)
    
    setOutgoingCall(callData)
    setCallState('calling')
    
    socket.emit('initiate-call', callData)
    
    // Set timeout for no answer
    callTimeoutRef.current = setTimeout(() => {
      console.log('Call timeout - no answer')
      endCall()
    }, CALL_TIMEOUT)
    
    return callData
  }, [user])

  // Accept incoming call
  const acceptCall = useCallback((callData) => {
    if (!callData) return null
    
    console.log('Accepting call:', callData)
    clearTimeout(callTimeoutRef.current)
    
    setCallState('connected')
    setIncomingCall(null)
    
    socket.emit('accept-call', callData)
    
    return callData
  }, [])

  // Reject incoming call
  const rejectCall = useCallback((callData) => {
    if (!callData) return
    
    console.log('Rejecting call:', callData)
    clearTimeout(callTimeoutRef.current)
    
    setCallState('idle')
    setIncomingCall(null)
    
    socket.emit('reject-call', callData)
  }, [])

  // End current call
  const endCall = useCallback(() => {
    console.log('Ending call')
    clearTimeout(callTimeoutRef.current)
    
    const callToEnd = incomingCall || outgoingCall
    if (callToEnd) {
      socket.emit('end-call', callToEnd)
    }
    
    setCallState('idle')
    setIncomingCall(null)
    setOutgoingCall(null)
  }, [incomingCall, outgoingCall])

  return {
    incomingCall,
    outgoingCall,
    callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall
  }
}