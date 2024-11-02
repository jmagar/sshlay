import express from 'express';
import { Client } from 'ssh2';

const router = express.Router();

router.get('/', (req, res) => {
  // Fetch all SSH connections from your database
  res.json([{ id: '1', name: 'Example Server', hostname: 'example.com' }]);
});

router.post('/', (req, res) => {
  // Add a new SSH connection to your database
  res.status(201).json({ id: '2', ...req.body });
});

router.post('/test', (req, res) => {
  const { hostname, port, username, password } = req.body;
  const conn = new Client();

  conn.on('ready', () => {
    console.log('SSH Connection successful');
    conn.end();
    res.json({ success: true, message: 'SSH connection successful' });
  }).on('error', (err) => {
    console.error('SSH Connection failed:', err);
    res.status(400).json({ success: false, message: 'SSH connection failed' });
  }).connect({
    host: hostname,
    port: port || 22,
    username,
    password
  });
});

export default router;
