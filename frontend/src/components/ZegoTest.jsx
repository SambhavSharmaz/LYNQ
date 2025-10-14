import React, { useState } from 'react'
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'

export default function ZegoTest() {
  const [testResult, setTestResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testZegoConnection = async () => {
    setIsLoading(true)
    setTestResult('Testing...')

    try {
      const appId = parseInt(import.meta.env.VITE_ZEGO_APP_ID)
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET

      console.log('🧪 Testing Zegocloud Connection')
      console.log('App ID:', appId ? `${appId}` : 'NOT FOUND')
      console.log('Server Secret:', serverSecret ? `${serverSecret.substring(0, 8)}...` : 'NOT FOUND')

      if (!appId || !serverSecret) {
        setTestResult('❌ App ID or Server Secret not found in environment variables')
        setIsLoading(false)
        return
      }

      // Create a test engine
      const zg = new ZegoExpressEngine(appId, serverSecret)
      
      // Generate a test token
      const testUserId = 'test-user-' + Math.random().toString(36).substring(2, 8)
      const token = zg.generateToken04(
        appId,
        testUserId,
        serverSecret,
        3600, // 1 hour validity
        ''
      )

      if (token) {
        setTestResult('✅ Successfully initialized Zegocloud! App ID and Server Secret are valid.')
        
        // Try to login to a test room
        const testRoomId = 'test-room-' + Date.now()
        await zg.loginRoom(testRoomId, {
          userID: testUserId,
          userName: 'Test User'
        }, { userUpdate: true }, token)

        setTestResult('✅ Successfully connected to Zegocloud and joined test room!')
        
        // Clean up
        await zg.logoutRoom()
      }
      
      zg.destroyEngine()
      
    } catch (error) {
      console.error('Zego test error:', error)
      
      if (error.message.includes('invalid appID')) {
        setTestResult('❌ Invalid App ID - Please check your Zegocloud Console settings')
      } else if (error.message.includes('token')) {
        setTestResult('❌ Token generation failed - Please check your Server Secret')
      } else {
        setTestResult(`❌ Connection failed: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 p-4 rounded shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">Zegocloud Connection Test</h3>
      
      <button 
        onClick={testZegoConnection}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 mb-3"
      >
        {isLoading ? 'Testing...' : 'Test Zegocloud Connection'}
      </button>
      
      {testResult && (
        <div className="text-sm p-2 bg-gray-100 rounded">
          {testResult}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-600">
        <strong>Environment Check:</strong><br />
        App ID: {import.meta.env.VITE_ZEGO_APP_ID ? '✅ Found' : '❌ Missing'}<br />
        Server Secret: {import.meta.env.VITE_ZEGO_SERVER_SECRET ? '✅ Found' : '❌ Missing'}
      </div>
    </div>
  )
}