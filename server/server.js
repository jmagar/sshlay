const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectToDatabase } = require('./db');
const redis = require('./redis');
const routes = require('./routes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToDatabase();

// Use routes
app.use('/api', routes);

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Redis subscription for real-time updates
const redisSub = redis.duplicate();
redisSub.subscribe('docker:logs', 'ssh:output');

redisSub.on('message', (channel, message) => {
  io.emit(channel, message);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));