import React from 'react'

export default function EnvDebug() {
  return (
    <div className="fixed top-4 left-4 bg-black text-white p-4 rounded text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Environment Variables Debug</h3>
      <div className="space-y-1">
        <div>
          <strong>VITE_AGORA_APP_ID:</strong> 
          <span className="ml-2">
            {import.meta.env.VITE_AGORA_APP_ID ? 
              `${import.meta.env.VITE_AGORA_APP_ID.substring(0, 8)}...` : 
              'NOT FOUND'
            }
          </span>
        </div>
        <div>
          <strong>VITE_AGORA_TEMP_TOKEN:</strong>
          <span className="ml-2">
            {import.meta.env.VITE_AGORA_TEMP_TOKEN ? 
              `${import.meta.env.VITE_AGORA_TEMP_TOKEN.substring(0, 10)}...` : 
              'NOT FOUND'
            }
          </span>
        </div>
        <div>
          <strong>VITE_BACKEND_URL:</strong>
          <span className="ml-2">{import.meta.env.VITE_BACKEND_URL || 'NOT FOUND'}</span>
        </div>
        <div>
          <strong>MODE:</strong>
          <span className="ml-2">{import.meta.env.MODE}</span>
        </div>
        <div>
          <strong>DEV:</strong>
          <span className="ml-2">{import.meta.env.DEV.toString()}</span>
        </div>
      </div>
    </div>
  )
}