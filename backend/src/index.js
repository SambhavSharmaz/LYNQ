require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const healthRouter = require('./routes/health');
const aiRouter = require('./routes/ai');

const PORT = process.env.PORT || 5000;

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',           // React dev server
  'http://localhost:5173',           // Vite dev server  
  'http://localhost:4173',           // Vite preview
  'https://lynq-7888.web.app',     // Firebase Hosting (production)
  'https://your-custom-domain.com', // Custom domain if you have one
  process.env.FRONTEND_ORIGIN       // Additional origin from environment
].filter(Boolean); // Remove undefined values

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

// Enhanced CORS configuration
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log allowed origins for debugging
console.log('Allowed CORS origins:', allowedOrigins);

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Client should emit { chatId, userId }
  socket.on('join', ({ chatId, userId }) => {
    if (!chatId) return;
    socket.join(chatId);
    socket.data.userId = userId;
    socket.data.chatId = chatId;
    io.to(chatId).emit('presence', { userId, status: 'online' });
  });

  // Handle user presence
  socket.on('user-online', (data) => {
    socket.userId = data.userId;
    // Join user to their personal room for receiving calls
    socket.join(data.userId);
    socket.broadcast.emit('user-status-change', { 
      userId: data.userId, 
      isOnline: true 
    });
  });
  
  socket.on('user-offline', (data) => {
    socket.broadcast.emit('user-status-change', { 
      userId: data.userId, 
      isOnline: false 
    });
  });
  
  socket.on('user-heartbeat', (data) => {
    // Just acknowledge the heartbeat
    socket.emit('heartbeat-ack');
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    if (!data.chatId) return;
    socket.to(data.chatId).emit('typing-start', data);
  });
  
  socket.on('typing-stop', (data) => {
    if (!data.chatId) return;
    socket.to(data.chatId).emit('typing-stop', data);
  });

  // Legacy typing event (keep for compatibility)
  socket.on('typing', ({ chatId, userId, typing }) => {
    if (!chatId) return;
    socket.to(chatId).emit('typing', { userId, typing: !!typing });
  });

  // Relay message to room. Persistence should happen on the client (Firestore)
  socket.on('message', (payload) => {
    const { chatId } = payload || {};
    if (!chatId) return;
    io.to(chatId).emit('message', payload);
  });

  // ===== VIDEO CALL SIGNALING EVENTS =====
  
  // Handle call initiation
  socket.on('initiate-call', (callData) => {
    console.log(`Call initiated from ${callData.callerId} to ${callData.recipientId}`);
    // Send call invitation to recipient
    socket.to(callData.recipientId).emit('incoming-call', callData);
  });

  // Handle call acceptance
  socket.on('accept-call', (callData) => {
    console.log(`Call accepted by ${callData.recipientId} from ${callData.callerId}`);
    // Notify caller that call was accepted
    socket.to(callData.callerId).emit('call-accepted', callData);
  });

  // Handle call rejection
  socket.on('reject-call', (callData) => {
    console.log(`Call rejected by ${callData.recipientId} from ${callData.callerId}`);
    // Notify caller that call was rejected
    socket.to(callData.callerId).emit('call-rejected', callData);
  });

  // Handle call end
  socket.on('end-call', (callData) => {
    console.log(`Call ended: ${callData.callId}`);
    // Notify both parties that call has ended
    socket.to(callData.callerId).emit('call-ended', callData);
    socket.to(callData.recipientId).emit('call-ended', callData);
  });

  // Handle call busy (when user is already in another call)
  socket.on('call-busy', (callData) => {
    console.log(`User ${callData.recipientId} is busy`);
    socket.to(callData.callerId).emit('call-busy', callData);
  });

  // Handle call timeout (no answer after 30 seconds)
  socket.on('call-timeout', (callData) => {
    console.log(`Call timeout: ${callData.callId}`);
    socket.to(callData.callerId).emit('call-timeout', callData);
    socket.to(callData.recipientId).emit('call-timeout', callData);
  });

  socket.on('disconnecting', () => {
    const userId = socket.data.userId || socket.userId;
    
    // Notify chat rooms about user going offline
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        io.to(room).emit('presence', { userId, status: 'offline' });
      }
    }
    
    // Broadcast user offline status globally
    if (userId) {
      socket.broadcast.emit('user-status-change', { 
        userId, 
        isOnline: false 
      });
      
      // End any ongoing calls when user disconnects
      socket.broadcast.emit('user-offline', userId);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[lynq] backend running on port ${PORT}`);
});
