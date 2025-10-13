// Backend Socket.IO Implementation for Lynq Chat Application
// Add this code to your backend server file

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://lynq-96f69.web.app/' // Replace with your actual frontend domain
  ],
  credentials: true
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://lynq-96f69.web.app/' // Replace with your actual frontend domain
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store user connections
const userSocketMap = new Map();
const activeCalls = new Map();

// Helper function to get socket by user ID
function getSocketByUserId(userId) {
  const socketId = userSocketMap.get(userId);
  return socketId ? io.sockets.sockets.get(socketId) : null;
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User connection management
  socket.on('user-online', (data) => {
    const { userId } = data;
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} is online with socket ${socket.id}`);
    
    // Broadcast to other users that this user is online
    socket.broadcast.emit('user-status-change', {
      userId,
      isOnline: true,
      lastSeen: new Date()
    });
  });

  socket.on('user-offline', (data) => {
    const { userId } = data;
    userSocketMap.delete(userId);
    console.log(`User ${userId} went offline`);
    
    // Broadcast to other users that this user is offline
    socket.broadcast.emit('user-status-change', {
      userId,
      isOnline: false,
      lastSeen: new Date()
    });
  });

  socket.on('user-heartbeat', (data) => {
    const { userId } = data;
    // Update user's last seen timestamp
    socket.broadcast.emit('user-status-change', {
      userId,
      isOnline: true,
      lastSeen: new Date()
    });
  });

  // Chat message handling
  socket.on('send-message', (data) => {
    const { chatId, message, members } = data;
    
    // Broadcast to all members of the chat
    members.forEach(memberId => {
      const memberSocket = getSocketByUserId(memberId);
      if (memberSocket && memberSocket.id !== socket.id) {
        memberSocket.emit('receive-message', {
          chatId,
          message
        });
      }
    });
  });

  // Typing indicators
  socket.on('typing-start', (data) => {
    const { chatId, userId, userName } = data;
    socket.broadcast.emit('typing-start', {
      chatId,
      userId,
      userName
    });
  });

  socket.on('typing-stop', (data) => {
    const { chatId, userId } = data;
    socket.broadcast.emit('typing-stop', {
      chatId,
      userId
    });
  });

  // ===== CALLING FUNCTIONALITY =====

  // Handle call request
  socket.on('call-request', (data) => {
    const { id, from, to, type, offer, timestamp } = data;
    
    console.log(`Call request from ${from} to ${to} (${type})`);
    
    // Store call state
    activeCalls.set(id, {
      caller: from,
      callee: to,
      type,
      status: 'ringing',
      timestamp
    });
    
    // Forward to target user if online
    const targetSocket = getSocketByUserId(to);
    if (targetSocket) {
      targetSocket.emit('call-request', data);
    } else {
      // Target user is offline, notify caller
      socket.emit('call-reject', {
        callId: id,
        reason: 'User is offline'
      });
      activeCalls.delete(id);
    }
  });

  // Handle call answer
  socket.on('call-answer', (data) => {
    const { callId, to, answer } = data;
    
    console.log(`Call ${callId} answered`);
    
    // Update call state
    const call = activeCalls.get(callId);
    if (call) {
      call.status = 'connected';
    }
    
    // Forward to caller
    const targetSocket = getSocketByUserId(to);
    if (targetSocket) {
      targetSocket.emit('call-answer', data);
    }
  });

  // Handle call reject
  socket.on('call-reject', (data) => {
    const { callId, to } = data;
    
    console.log(`Call ${callId} rejected`);
    
    // Remove call state
    activeCalls.delete(callId);
    
    // Forward to caller
    const targetSocket = getSocketByUserId(to);
    if (targetSocket) {
      targetSocket.emit('call-reject', data);
    }
  });

  // Handle call end
  socket.on('call-end', (data) => {
    const { callId, to } = data;
    
    console.log(`Call ${callId} ended`);
    
    // Remove call state
    activeCalls.delete(callId);
    
    // Forward to other user
    const targetSocket = getSocketByUserId(to);
    if (targetSocket) {
      targetSocket.emit('call-end', data);
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { candidate, callId, to } = data;
    
    // Forward to other user
    const targetSocket = getSocketByUserId(to);
    if (targetSocket) {
      targetSocket.emit('ice-candidate', data);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    // Remove user from mapping and notify others
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        
        // Broadcast offline status
        socket.broadcast.emit('user-status-change', {
          userId,
          isOnline: false,
          lastSeen: new Date()
        });
        
        // End any active calls for this user
        for (const [callId, call] of activeCalls.entries()) {
          if (call.caller === userId || call.callee === userId) {
            const otherUserId = call.caller === userId ? call.callee : call.caller;
            const otherSocket = getSocketByUserId(otherUserId);
            
            if (otherSocket) {
              otherSocket.emit('call-end', {
                callId,
                reason: 'User disconnected'
              });
            }
            
            activeCalls.delete(callId);
          }
        }
        
        break;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for use in other files
module.exports = { app, server, io };