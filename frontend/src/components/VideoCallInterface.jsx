import React, { useState, useEffect } from 'react'
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'

export default function VideoCallInterface({
  localVideoRef,
  remoteUsers,
  callType,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  show
}) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  useEffect(() => {
    setIsAudioEnabled(true)
    setIsVideoEnabled(true)
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video(s) */}
      <div className="flex-1 relative">
        {Object.values(remoteUsers).map(user => (
          <div key={user.uid} id={`remote-${user.uid}`} className="w-full h-full" />
        ))}

        {/* Local video */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden shadow-lg">
            <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center space-x-6">
        <button
          onClick={() => { setIsAudioEnabled(!isAudioEnabled); onToggleAudio() }}
          className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-500'}`}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={() => { setIsVideoEnabled(!isVideoEnabled); onToggleVideo() }}
            className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'}`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
          </button>
        )}

        <button onClick={onEndCall} className="p-4 rounded-full bg-red-500">
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}
