import React, { useEffect, useState } from 'react'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Maximize2,
  Minimize2
} from 'lucide-react'

export default function VideoCallInterface({
  localVideoRef,
  remoteVideoRef,
  isVideoEnabled,
  isAudioEnabled,
  callType,
  callState,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
  callerName,
  show
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  // Timer for call duration
  useEffect(() => {
    let interval = null
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState])

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (!show) return

    let timeout = null
    const resetTimeout = () => {
      setShowControls(true)
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }

    const handleMouseMove = () => resetTimeout()
    document.addEventListener('mousemove', handleMouseMove)
    resetTimeout()

    return () => {
      if (timeout) clearTimeout(timeout)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [show])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Call status bar */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-semibold">{callerName}</h2>
            <p className="text-sm text-gray-300">
              {callState === 'calling' && 'Calling...'}
              {callState === 'receiving' && 'Incoming call...'}
              {callState === 'connected' && formatDuration(callDuration)}
            </p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 relative">
        {/* Remote video (main) */}
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold">
                  {callerName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold">{callerName}</h3>
              <p className="text-gray-200">Voice Call</p>
            </div>
          </div>
        )}

        {/* Local video (small overlay) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-center space-x-6">
          {/* Audio toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-4 rounded-full transition-colors duration-200 ${
              isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video toggle (only for video calls) */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`p-4 rounded-full transition-colors duration-200 ${
                isVideoEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* End call */}
          <button
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors duration-200"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}