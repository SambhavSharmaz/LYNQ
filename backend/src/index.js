require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const healthRouter = require('./routes/health');
const aiRouter = require('./routes/ai');

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN, credentials: true }));

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN,
    methods: ['GET', 'POST']
  },
  path: '/socket.io'
});

io.on('connection', (socket) => {
  // Client should emit { chatId, userId }
  socket.on('join', ({ chatId, userId }) => {
    if (!chatId) return;
    socket.join(chatId);
    socket.data.userId = userId;
    io.to(chatId).emit('presence', { userId, status: 'online' });
  });

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
    const userId = socket.data.userId;
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        io.to(room).emit('presence', { userId, status: 'offline' });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[lynq] backend running on port ${PORT}`);
});
