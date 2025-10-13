import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import CallNotification from '../components/CallNotification'
import VideoCallInterface from '../components/VideoCallInterface'
import { ChatsProvider } from '../context/ChatsContext'
import { usePresence } from '../hooks/usePresence'
import { useWebRTC } from '../hooks/useWebRTC'
import { useUsers } from '../hooks/useUsers'
import { socket } from '../lib/socket'

function ChatContent() {
  // Initialize presence system for this user
  usePresence()
  const { usersMap } = useUsers()
  const [incomingCall, setIncomingCall] = useState(null)
  
  // WebRTC functionality
  const {
    localVideoRef,
    remoteVideoRef,
    isCallActive,
    isVideoEnabled,
    isAudioEnabled,
    callType,
    callState,
    currentCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useWebRTC()

  // Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = (callData) => {
      setIncomingCall(callData)
    }

    socket.on('call-request', handleIncomingCall)

    return () => {
      socket.off('call-request', handleIncomingCall)
    }
  }, [])

  // Handle starting a call from chat window
  const handleStartCall = (targetUserId, type) => {
    startCall(targetUserId, type)
  }

  // Handle answering incoming call
  const handleAnswerCall = (callData) => {
    setIncomingCall(null)
    answerCall(callData)
  }

  // Handle rejecting incoming call
  const handleRejectCall = (callData) => {
    setIncomingCall(null)
    rejectCall(callData)
  }

  // Get caller info for notifications
  const getCallerInfo = (callData) => {
    const caller = usersMap[callData?.from]
    return {
      name: caller?.displayName || caller?.email || 'Unknown User',
      avatar: caller?.photoURL || null
    }
  }

  const callerInfo = incomingCall ? getCallerInfo(incomingCall) : null
  const currentCallerInfo = currentCall ? getCallerInfo({ from: currentCall.otherUserId }) : null
  
  return (
    <div className="h-full flex flex-col relative">
      <Header />
      <div className="flex-1 grid grid-cols-4 gap-0">
        <div className="col-span-1 border-r overflow-y-auto">
          <ChatList />
        </div>
        <div className="col-span-3 overflow-hidden">
          <ChatWindow onStartCall={handleStartCall} />
        </div>
      </div>

      {/* Call Notification */}
      <CallNotification
        show={!!incomingCall}
        callData={incomingCall}
        callerName={callerInfo?.name}
        callerAvatar={callerInfo?.avatar}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />

      {/* Video Call Interface */}
      <VideoCallInterface
        show={isCallActive}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        callType={callType}
        callState={callState}
        callerName={currentCallerInfo?.name || 'Unknown'}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onEndCall={endCall}
      />
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
