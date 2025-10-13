# Backend Socket Events for Video/Voice Calling

This document outlines the socket events that need to be implemented on the backend to support video and voice calling functionality.

## Required Socket Events

### 1. Call Request
**Event:** `call-request`
**Direction:** Client → Server
**Data:**
```javascript
{
  id: string,        // Unique call ID
  from: string,      // Caller's user ID
  to: string,        // Callee's user ID
  type: string,      // 'video' or 'voice'
  offer: RTCSessionDescription,  // WebRTC offer
  timestamp: number
}
```
**Backend Action:** Forward to the target user if online

### 2. Call Answer
**Event:** `call-answer`
**Direction:** Client → Server
**Data:**
```javascript
{
  callId: string,    // Call ID
  to: string,        // Caller's user ID
  answer: RTCSessionDescription  // WebRTC answer
}
```
**Backend Action:** Forward to the caller

### 3. Call Reject
**Event:** `call-reject`
**Direction:** Client → Server
**Data:**
```javascript
{
  callId: string,    // Call ID
  to: string         // Caller's user ID
}
```
**Backend Action:** Forward to the caller

### 4. Call End
**Event:** `call-end`
**Direction:** Client → Server
**Data:**
```javascript
{
  callId: string,    // Call ID
  to: string         // Other user's ID
}
```
**Backend Action:** Forward to the other user

### 5. ICE Candidate
**Event:** `ice-candidate`
**Direction:** Client → Server
**Data:**
```javascript
{
  candidate: RTCIceCandidate,  // ICE candidate
  callId: string,              // Call ID
  to: string                   // Other user's ID
}
```
**Backend Action:** Forward to the other user

## Backend Implementation Example (Node.js/Socket.io)

```javascript
// Handle call request
socket.on('call-request', (data) => {
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-request', data)
  }
})

// Handle call answer
socket.on('call-answer', (data) => {
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-answer', data)
  }
})

// Handle call reject
socket.on('call-reject', (data) => {
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-reject', data)
  }
})

// Handle call end
socket.on('call-end', (data) => {
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-end', data)
  }
})

// Handle ICE candidates
socket.on('ice-candidate', (data) => {
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('ice-candidate', data)
  }
})
```

## User Connection Management

The backend needs to maintain a mapping of user IDs to socket IDs:

```javascript
const userSocketMap = new Map()

// On user connection
socket.on('user-connected', (userId) => {
  userSocketMap.set(userId, socket.id)
})

// On user disconnection
socket.on('disconnect', () => {
  // Remove user from mapping
  for (const [userId, socketId] of userSocketMap.entries()) {
    if (socketId === socket.id) {
      userSocketMap.delete(userId)
      break
    }
  }
})

// Helper function to get socket by user ID
function getSocketByUserId(userId) {
  const socketId = userSocketMap.get(userId)
  return socketId ? io.sockets.sockets.get(socketId) : null
}
```

## Call State Management (Optional)

For better reliability, the backend can optionally track active calls:

```javascript
const activeCalls = new Map()

socket.on('call-request', (data) => {
  // Store call state
  activeCalls.set(data.id, {
    caller: data.from,
    callee: data.to,
    type: data.type,
    status: 'ringing',
    timestamp: Date.now()
  })
  
  // Forward to target user
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-request', data)
  }
})

socket.on('call-answer', (data) => {
  // Update call state
  const call = activeCalls.get(data.callId)
  if (call) {
    call.status = 'connected'
  }
  
  // Forward to caller
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-answer', data)
  }
})

socket.on('call-end', (data) => {
  // Remove call state
  activeCalls.delete(data.callId)
  
  // Forward to other user
  const targetSocket = getSocketByUserId(data.to)
  if (targetSocket) {
    targetSocket.emit('call-end', data)
  }
})
```

## Notes

1. **STUN/TURN Servers**: For production, consider using proper STUN/TURN servers for better connectivity
2. **Authentication**: Ensure all call events are properly authenticated
3. **Rate Limiting**: Implement rate limiting to prevent spam calls
4. **Logging**: Log call events for debugging and analytics
5. **Error Handling**: Add proper error handling for all events