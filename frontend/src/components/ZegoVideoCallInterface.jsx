import React from 'react'
import { PhoneOff, Loader2 } from 'lucide-react'

export default function ZegoVideoCallInterface({
  callContainerRef,
  isCallActive,
  callType,
  onEndCall,
  show,
  isLoading,
  error
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Error display */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-60">
          {error}
        </div>
      )}

      {/* Loading state - only show if not yet active */}
      {isLoading && !isCallActive && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="flex flex-col items-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Connecting to call...</p>
          </div>
        </div>
      )}

      {/* Zego UIKit Container */}
      <div 
        ref={callContainerRef}
        className="flex-1 w-full h-full bg-gray-900"
        style={{ 
          width: '100vw', 
          height: '100vh',
          position: 'relative'
        }}
      >
        {/* Show waiting message only when there's an error or not active yet */}
        {!isCallActive && !isLoading && error && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
            Failed to connect
          </div>
        )}
      </div>

      {/* Custom End Call Button (positioned to not interfere with Zego UI) */}
      {isCallActive && (
        <div className="absolute top-4 right-4 z-60">
          <button 
            onClick={onEndCall} 
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Call type indicator */}
      {isCallActive && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm z-60">
          {callType === 'video' ? 'Video Call' : 'Audio Call'}
        </div>
      )}
    </div>
  )
}