import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectToDatabase } from './db.js';
import redis from './redis.js';
import routes from './routes/index.js';
import fileUpload from 'express-fileupload';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configure file upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: process.env.NODE_ENV === 'development'
}));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
