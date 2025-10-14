import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import CallNotification from '../components/CallNotification'
import VideoCallInterface from '../components/VideoCallInterface'
import EnvDebug from '../components/EnvDebug'
import ZegoTest from '../components/ZegoTest'
import { ChatsProvider } from '../context/ChatsContext'
import { usePresence } from '../hooks/usePresence'
import { useZegoCloud } from '../hooks/useZegoCloud'
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

  // Zegocloud RTC hook
  const {
    localVideoRef,
    remoteUsers,
    isCallActive,
    callType,
    currentCall,
    error: zegoError,
    isLoading,
    initCall,
    endCall: endZegoCall,
    toggleAudio,
    toggleVideo
  } = useZegoCloud()

  // Handle start call - initiate call signaling first
  const handleStartCall = async (targetUserId, type) => {
    if (!targetUserId) return
    
    try {
      const callData = await initiateCall(targetUserId, type)
      if (callData) {
        // Start Zegocloud call immediately for caller
        const success = await initCall(callData.channel, type)
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
      // Join the Zegocloud channel
      const success = await initCall(callData.channel, callData.type)
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

  // Get user info
  const getUserInfo = (uid) => {
    const u = usersMap[uid]
    return { name: u?.displayName || u?.email || 'Unknown', avatar: u?.photoURL || null }
  }

  return (
    <div className="h-full flex flex-col relative">
      <EnvDebug />
      <ZegoTest />
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
      <VideoCallInterface
        show={isCallActive || callState === 'connected'}
        localVideoRef={localVideoRef}
        remoteUsers={remoteUsers}
        callType={callType}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEndCall={handleEndCall}
      />

      {/* Show loading or error states */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg">
            <p>Connecting to call...</p>
          </div>
        </div>
      )}
      
      {zegoError && (
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
