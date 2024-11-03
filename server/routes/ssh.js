import express from 'express';
import { Client } from 'ssh2';
import { importSSHConfig, importSSHConfigFile } from '../lib/ssh.js';
import fileUpload from 'express-fileupload';

const router = express.Router();

// Configure file upload middleware for this router
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: process.env.NODE_ENV === 'development'
}));

// Get all SSH connections
router.get('/', async (req, res) => {
  try {
    const connections = await getSSHConnections();
    res.json(connections);
  } catch (error) {
    console.error('Failed to fetch SSH connections:', error);
    res.status(500).json({ error: 'Failed to fetch SSH connections' });
  }
});

// Get a single SSH connection
router.get('/:id', async (req, res) => {
  try {
    const connection = await getSSHConnection(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'SSH connection not found' });
    }
    res.json(connection);
  } catch (error) {
    console.error('Failed to fetch SSH connection:', error);
    res.status(500).json({ error: 'Failed to fetch SSH connection' });
  }
});

// Add a new SSH connection
router.post('/', async (req, res) => {
  try {
    const connection = await addSSHConnection(req.body);
    res.status(201).json(connection);
  } catch (error) {
    console.error('Failed to add SSH connection:', error);
    res.status(500).json({ error: 'Failed to add SSH connection' });
  }
});

// Delete an SSH connection
router.delete('/:id', async (req, res) => {
  try {
    await deleteSSHConnection(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete SSH connection:', error);
    res.status(500).json({ error: 'Failed to delete SSH connection' });
  }
});

// Test an SSH connection
router.post('/test', async (req, res) => {
  try {
    const result = await testSSHConnection(req.body);
    res.json(result);
  } catch (error) {
    console.error('SSH connection test failed:', error);
    res.status(400).json(error);
  }
});

// Import SSH config from file upload
router.post('/import', async (req, res) => {
  try {
    if (!req.files || !req.files.config) {
      return res.status(400).json({
        success: false,
        error: 'No config file provided'
      });
    }

    const configFile = req.files.config;

    // Validate file size
    if (configFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 5MB limit'
      });
    }

    // Validate file type
    const allowedTypes = ['.conf', '.config', '.txt'];
    const ext = '.' + configFile.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Allowed types: .conf, .config, .txt'
      });
    }

    // Read and parse the file content
    const configContent = configFile.data.toString('utf8');
    if (!configContent.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Config file is empty'
      });
    }

    // Import the SSH config
    const result = await importSSHConfig(configContent);
    res.json(result);
  } catch (error) {
    console.error('Error importing SSH config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import SSH config'
    });
  }
});

// Import SSH config from file path
router.put('/import', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'No path provided'
      });
    }

    // Validate the path
    if (path.includes('..') || !path.includes('.ssh/config')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path. Only ~/.ssh/config is supported.'
      });
    }

    // Import the SSH config
    const result = await importSSHConfigFile(path);
    res.json(result);
  } catch (error) {
    console.error('Error importing SSH config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import SSH config'
    });
  }
});

export default router;
