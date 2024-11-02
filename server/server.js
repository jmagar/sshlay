import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import sshRoutes from './routes/ssh.js';
import fileRoutes from './routes/file.js';
import dockerRoutes from './routes/docker.js';
import logRoutes from './routes/logs.js';
import connectDB from './db.js';
import { auth } from './middleware/auth.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// Connect to MongoDB
connectDB();

// Protected Routes
app.use('/api/ssh-connections', auth, sshRoutes);
app.use('/api/files', auth, fileRoutes);
app.use('/api/docker', auth, dockerRoutes);
app.use('/api/logs', auth, logRoutes);

// WebSocket for terminal
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('terminal_input', (data) => {
    // Handle terminal input and send output back
    // You'll need to implement the actual SSH connection and command execution here
    socket.emit('terminal_output', { output: `Received: ${data.input}` });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
