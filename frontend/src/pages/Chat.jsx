import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import CallNotification from '../components/CallNotification'
import VideoCallInterface from '../components/VideoCallInterface'
import { ChatsProvider } from '../context/ChatsContext'
import { usePresence } from '../hooks/usePresence'
import { useAgoraRTC } from '../hooks/useAgoraRTC'
import { useUsers } from '../hooks/useUsers'

function ChatContent() {
  usePresence()
  const { usersMap } = useUsers()
  const [incomingCall, setIncomingCall] = useState(null)

  const {
    localVideoRef,
    remoteUsers,
    isCallActive,
    callType,
    currentCall,
    initCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useAgoraRTC()

  // Handle start call
  const handleStartCall = (targetUserId, type) => {
    if (!targetUserId) return
    initCall(targetUserId, type) // targetUserId acts as channel name
  }

  // Handle end call
  const handleEndCall = () => {
    endCall()
  }

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

      {/* Video call interface */}
      <VideoCallInterface
        show={isCallActive}
        localVideoRef={localVideoRef}
        remoteUsers={remoteUsers}
        callType={callType}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEndCall={handleEndCall}
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
