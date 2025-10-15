import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import CallNotification from '../components/CallNotification'
import ZegoVideoCallInterface from '../components/ZegoVideoCallInterface'
import { ChatsProvider } from '../context/ChatsContext'
import { usePresence } from '../hooks/usePresence'
import { useZegoVideoCall } from '../hooks/useZegoVideoCall'
import { useCallSignaling } from '../hooks/useCallSignaling'
import { useUsers } from '../hooks/useUsers'

function ChatContent() {
  usePresence()
  const { usersMap } = useUsers()

  // Call signaling hook
  const {
    incomingCall,
    outgoingCall,
    callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall: endCallSignaling
  } = useCallSignaling()

  // Zego video call hook
  const {
    callContainerRef,
    isCallActive,
    callType,
    currentCall,
    error: zegoError,
    isLoading,
    initCall,
    endCall: endZegoCall,
    toggleAudio,
    toggleVideo
  } = useZegoVideoCall()

  // Handle start call - initiate call signaling first
  const handleStartCall = async (targetUserId, type) => {
    if (!targetUserId) return
    
    try {
      const callData = await initiateCall(targetUserId, type)
      if (callData) {
        // Start Zegocloud call immediately for caller
        const success = await initCall(callData.roomID, type)
        if (!success) {
          // If Zegocloud fails, end the signaling
          endCallSignaling()
        }
      }
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  // Handle answer incoming call
  const handleAnswerCall = async (callData) => {
    if (!callData) return
    
    try {
      acceptCall(callData)
      // Join the Zego room
      const success = await initCall(callData.roomID, callData.type)
      if (!success) {
        // If Zegocloud fails, reject the call
        rejectCall(callData)
      }
    } catch (error) {
      console.error('Failed to answer call:', error)
      rejectCall(callData)
    }
  }

  // Handle reject call
  const handleRejectCall = (callData) => {
    rejectCall(callData)
  }

  // Handle end call - end both signaling and Zegocloud
  const handleEndCall = () => {
    endCallSignaling()
    endZegoCall()
  }

  // Sync call states - if signaling ends but video call is still active, end video call
  useEffect(() => {
    let timeoutId
    if (callState === 'idle' && isCallActive) {
      console.log('Call signaling ended, ending video call')
      // Use timeout to prevent race conditions
      timeoutId = setTimeout(() => {
        endZegoCall()
      }, 100)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [callState, isCallActive, endZegoCall])

  // Sync call states - if video call ends but signaling is still active, end signaling
  useEffect(() => {
    let timeoutId
    if (!isCallActive && !isLoading && (callState === 'connected' || callState === 'calling')) {
      console.log('Video call ended, ending signaling')
      // Use timeout to prevent race conditions and only if not loading
      timeoutId = setTimeout(() => {
        endCallSignaling()
      }, 100)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isCallActive, isLoading, callState, endCallSignaling])

  // Get user info
  const getUserInfo = (uid) => {
    const u = usersMap[uid]
    return { name: u?.displayName || u?.email || 'Unknown', avatar: u?.photoURL || null }
  }

  return (
    <div className="h-full flex flex-col relative">
      <Header />
      <div className="flex-1 grid grid-cols-4 gap-0">
        <div className="col-span-1 border-r overflow-y-auto">
          <ChatList />
        </div>
        <div className="col-span-3 overflow-hidden">
          <ChatWindow onStartCall={handleStartCall} usersMap={usersMap} />
        </div>
      </div>

      {/* Call notification for incoming calls */}
      <CallNotification
        show={!!incomingCall && callState === 'incoming'}
        callData={incomingCall}
        callerName={incomingCall ? getUserInfo(incomingCall.callerId).name : ''}
        callerAvatar={incomingCall ? getUserInfo(incomingCall.callerId).avatar : ''}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />

      {/* Video call interface */}
      <ZegoVideoCallInterface
        show={isCallActive || callState === 'connected'}
        callContainerRef={callContainerRef}
        isCallActive={isCallActive}
        callType={callType}
        onEndCall={handleEndCall}
        isLoading={isLoading}
        error={zegoError}
      />

      {/* Error notification - only show if not in call */}
      {zegoError && !isCallActive && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50">
          <p>{zegoError}</p>
          <button onClick={() => handleEndCall()} className="mt-2 bg-red-600 px-3 py-1 rounded">
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default function Chat() {
  return (
    <ChatsProvider>
      <ChatContent />
    </ChatsProvider>
  )
}
