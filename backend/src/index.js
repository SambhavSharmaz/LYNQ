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
  'https://lynq-96f69.web.app',     // Firebase Hosting (production)
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
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[lynq] backend running on port ${PORT}`);
});
