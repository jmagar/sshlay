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
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close HTTP server first to stop accepting new connections
    await new Promise((resolve, reject) => {
      httpServer.close((err) => {
        if (err) {
          console.error('Error closing HTTP server:', err);
          reject(err);
        } else {
          console.log('HTTP server closed');
          resolve();
        }
      });
    });

    // Close Socket.IO connections
    await io.close();
    console.log('Socket.IO server closed');

    // Close Redis subscription connection
    if (redisSub) {
      await redisSub.quit().catch(err => {
        console.error('Error closing Redis subscription:', err);
      });
    }

    // Close database connections
    await closeDatabase();

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});
