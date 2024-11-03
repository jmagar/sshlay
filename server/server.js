/**
 * Main Server Entry Point
 *
 * Handles:
 * - Express server setup
 * - Socket.IO integration
 * - Database connections
 * - Graceful shutdown
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectToDatabase, closeDatabase } from './db.js';
import redis from './redis.js';
import routes from './routes/index.js';
import fileUpload from 'express-fileupload';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

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
await connectToDatabase();

// Use routes
app.use('/api', routes);

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Redis subscription for real-time updates
const redisSub = redis.duplicate();
await redisSub.subscribe('docker:logs', 'ssh:output');

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

// Start server
const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown handler
let isShuttingDown = false;

async function shutdown(signal) {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Use a single try-catch block for all cleanup
  try {
    // Close HTTP server first
    if (httpServer) {
      await new Promise(resolve => httpServer.close(resolve));
    }

    // Close Socket.IO
    if (io) {
      await io.close();
    }

    // Close Redis subscription
    if (redisSub && redisSub.status === 'ready') {
      await redisSub.quit();
    }

    // Close database connections
    await closeDatabase();

  } catch (error) {
    process.exit(1);
  }

  // Exit cleanly
  process.exit(0);
}

// Register shutdown handlers
const shutdownHandler = signal => {
  if (!isShuttingDown) {
    shutdown(signal).catch(() => process.exit(1));
  }
};

process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
process.on('SIGINT', () => shutdownHandler('SIGINT'));
process.on('uncaughtException', error => {
  if (!isShuttingDown && error.code !== 'EPIPE') {
    shutdownHandler('UNCAUGHT_EXCEPTION');
  }
});
process.on('unhandledRejection', (reason, promise) => {
  if (!isShuttingDown) {
    shutdownHandler('UNHANDLED_REJECTION');
  }
});
