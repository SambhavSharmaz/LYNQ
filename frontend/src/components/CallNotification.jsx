import React, { useState, useEffect } from 'react'
import { Phone, PhoneOff, Video, VideoOff } from 'lucide-react'

export default function CallNotification({ 
  callData, 
  callerName, 
  callerAvatar, 
  onAnswer, 
  onReject, 
  show 
}) {
  const [ringtoneAudio] = useState(() => new Audio('/ringtone.mp3'))

  useEffect(() => {
    if (show && callData && ringtoneAudio) {
      // Play ringtone
      ringtoneAudio.loop = true
      ringtoneAudio.play().catch(console.error)
    } else if (ringtoneAudio) {
      // Stop ringtone
      ringtoneAudio.pause()
      ringtoneAudio.currentTime = 0
    }

    return () => {
      if (ringtoneAudio) {
        ringtoneAudio.pause()
        ringtoneAudio.currentTime = 0
      }
    }
  }, [show, callData, ringtoneAudio])

  if (!show || !callData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      {/* Call notification card */}
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-pulse-slow">
        {/* Caller info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <img
              src={callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName || 'User')}&background=6366f1&color=fff&size=96`}
              alt={callerName}
              className="w-full h-full rounded-full object-cover border-4 border-green-500"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full">
              {callData.type === 'video' ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <Phone className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {callerName}
          </h2>
          
          <p className="text-gray-600">
            Incoming {callData.type} call...
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-8">
          {/* Reject button */}
          <button
            onClick={() => onReject(callData)}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200 transform hover:scale-105"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          {/* Answer button */}
          <button
            onClick={() => onAnswer(callData)}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200 transform hover:scale-105 animate-pulse"
          >
            {callData.type === 'video' ? (
              <Video className="w-8 h-8" />
            ) : (
              <Phone className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}