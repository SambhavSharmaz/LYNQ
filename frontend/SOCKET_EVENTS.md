# Socket Events for Backend Implementation

The frontend expects these socket events to be handled by the backend server:

## Presence Events

### Client -> Server
```javascript
// User comes online
socket.emit('user-online', { userId: 'user123' })

// User goes offline  
socket.emit('user-offline', { userId: 'user123' })

// Heartbeat to maintain connection
socket.emit('user-heartbeat', { userId: 'user123' })
```

### Server -> Client
```javascript
// Notify when user comes online
socket.broadcast.emit('user-status-change', { 
  userId: 'user123', 
  isOnline: true 
})

// Notify when user goes offline
socket.broadcast.emit('user-status-change', { 
  userId: 'user123', 
  isOnline: false 
})
```

## Typing Indicator Events

### Client -> Server
```javascript
// User starts typing
socket.emit('typing-start', {
  chatId: 'chat123',
  userId: 'user123',  
  userName: 'John Doe'
})

// User stops typing
socket.emit('typing-stop', {
  chatId: 'chat123',
  userId: 'user123'
})
```

### Server -> Client
```javascript
// Broadcast typing started to other chat members
socket.to('chat123').emit('typing-start', {
  chatId: 'chat123',
  userId: 'user123',
  userName: 'John Doe'  
})

// Broadcast typing stopped to other chat members
socket.to('chat123').emit('typing-stop', {
  chatId: 'chat123',
  userId: 'user123'
})
```

## Chat Events (existing)
```javascript
// Join chat room
socket.emit('join', { chatId: 'chat123', userId: 'user123' })

// Send message  
socket.emit('message', { chatId: 'chat123', ...messageData })
```

## Sample Backend Implementation (Node.js + Socket.io)

```javascript
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Handle user presence
  socket.on('user-online', (data) => {
    socket.userId = data.userId
    socket.broadcast.emit('user-status-change', { 
      userId: data.userId, 
      isOnline: true 
    })
  })
  
  socket.on('user-offline', (data) => {
    socket.broadcast.emit('user-status-change', { 
      userId: data.userId, 
      isOnline: false 
    })
  })
  
  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.chatId).emit('typing-start', data)
  })
  
  socket.on('typing-stop', (data) => {
    socket.to(data.chatId).emit('typing-stop', data)
  })
  
  // Handle chat joining
  socket.on('join', (data) => {
    socket.join(data.chatId)
  })
  
  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      socket.broadcast.emit('user-status-change', { 
        userId: socket.userId, 
        isOnline: false 
      })
    }
  })
})
```