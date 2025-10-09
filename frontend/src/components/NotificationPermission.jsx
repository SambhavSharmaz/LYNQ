import { useState } from 'react'
import { requestNotificationPermission, initializeMessaging } from '../lib/firebase'

const NotificationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission)
  const [isRequesting, setIsRequesting] = useState(false)

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      // Initialize messaging first
      await initializeMessaging()
      
      // Then request permission (this is now user-initiated)
      const token = await requestNotificationPermission()
      
      if (token) {
        setPermissionStatus('granted')
        console.log('Notification permission granted and FCM token received')
        // You can send the token to your backend here
      } else {
        setPermissionStatus(Notification.permission)
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  if (permissionStatus === 'granted') {
    return (
      <div className="notification-permission granted">
        <span>✅ Notifications enabled</span>
      </div>
    )
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="notification-permission denied">
        <span>🔕 Notifications blocked. Please enable them in your browser settings.</span>
      </div>
    )
  }

  return (
    <div className="notification-permission">
      <button 
        onClick={handleRequestPermission}
        disabled={isRequesting}
        className="btn-notification-permission"
      >
        {isRequesting ? 'Requesting...' : '🔔 Enable Notifications'}
      </button>
      <p className="permission-info">
        Get notified about new messages and updates
      </p>
    </div>
  )
}

export default NotificationPermission