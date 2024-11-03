import express from 'express';
import { executeCode } from '../lib/codeExecution.js';
import { getDevices, addDevice } from '../lib/devices.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { addSSHConnection, getSSHConnections, getSSHConnection, deleteSSHConnection } from '../lib/ssh.js';
import redis from '../redis.js';
import { connectToDatabase } from '../db.js';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const router = express.Router();

// Rate limiting middleware
const rateLimit = async (req, res, next) => {
  const key = `ratelimit:${req.ip}`;
  const limit = 100; // requests
  const window = 60; // seconds

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, window);
    }
    if (current > limit) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next();
  }
};

router.use(rateLimit);

// Docker Routes
router.get('/docker-containers', async (req, res) => {
  try {
    const cachedContainers = await redis.get('containers');
    if (cachedContainers) {
      return res.json(JSON.parse(cachedContainers));
    }

    const { stdout } = await execAsync('docker ps --format "{{json .}}"');
    const containers = stdout.trim().split('\n').map(line => JSON.parse(line));

    await redis.set('containers', JSON.stringify(containers), 'EX', 60); // Cache for 1 minute
    res.json(containers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

router.post('/docker-containers/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    if (!['start', 'stop', 'restart', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await execAsync(`docker ${action} ${id}`);
    await redis.del('containers'); // Invalidate cache
    res.json({ message: `Action ${action} performed on container ${id}` });
  } catch (error) {
    console.error(`Error performing docker action:`, error);
    res.status(500).json({ error: `Failed to ${req.params.action} container` });
  }
});

// SSH Routes
router.get('/ssh-connections', async (req, res) => {
  try {
    const cachedConnections = await redis.get('ssh:connections');
    if (cachedConnections) {
      return res.json(JSON.parse(cachedConnections));
    }

    const connections = await getSSHConnections();
    await redis.set('ssh:connections', JSON.stringify(connections), 'EX', 300); // Cache for 5 minutes
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SSH connections' });
  }
});

router.post('/ssh-connections', async (req, res) => {
  try {
    const connection = await addSSHConnection(req.body);
    await redis.del('ssh:connections'); // Invalidate cache
    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add SSH connection' });
  }
});

router.get('/ssh-connections/:id', async (req, res) => {
  try {
    const cacheKey = `ssh:connection:${req.params.id}`;
    const cachedConnection = await redis.get(cacheKey);
    if (cachedConnection) {
      return res.json(JSON.parse(cachedConnection));
    }

    const connection = await getSSHConnection(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'SSH connection not found' });
    }

    await redis.set(cacheKey, JSON.stringify(connection), 'EX', 300); // Cache for 5 minutes
    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SSH connection' });
  }
});

router.delete('/ssh-connections/:id', async (req, res) => {
  try {
    await deleteSSHConnection(req.params.id);
    await redis.del('ssh:connections'); // Invalidate cache
    await redis.del(`ssh:connection:${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete SSH connection' });
  }
});

// Device Routes
router.get('/devices', async (req, res) => {
  try {
    const cachedDevices = await redis.get('devices');
    if (cachedDevices) {
      return res.json(JSON.parse(cachedDevices));
    }

    const devices = await getDevices();
    await redis.set('devices', JSON.stringify(devices), 'EX', 300); // Cache for 5 minutes
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.post('/devices', async (req, res) => {
  try {
    const newDevice = await addDevice(req.body);
    await redis.del('devices'); // Invalidate cache
    res.status(201).json(newDevice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Logs Routes
router.get('/logs', async (req, res) => {
  try {
    const cachedLogs = await redis.get('logs:system');
    if (cachedLogs) {
      return res.json(JSON.parse(cachedLogs));
    }

    const { stdout } = await execAsync('journalctl -n 100 --no-pager');
    const logs = stdout.split('\n').map(line => {
      const [timestamp, ...rest] = line.split(' ');
      const level = rest[3] || 'INFO';
      const message = rest.slice(4).join(' ');
      return { timestamp, level, message };
    });

    await redis.set('logs:system', JSON.stringify(logs), 'EX', 30); // Cache for 30 seconds
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/logs/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const cacheKey = `logs:service:${service}`;

    const cachedLogs = await redis.get(cacheKey);
    if (cachedLogs) {
      return res.json(JSON.parse(cachedLogs));
    }

    const { stdout } = await execAsync(`journalctl -u ${service} -n 100 --no-pager`);
    const logs = stdout.split('\n').map(line => {
      const [timestamp, ...rest] = line.split(' ');
      const level = rest[3] || 'INFO';
      const message = rest.slice(4).join(' ');
      return { timestamp, level, message, service };
    });

    await redis.set(cacheKey, JSON.stringify(logs), 'EX', 30); // Cache for 30 seconds
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service logs' });
  }
});

// Code Execution Routes
router.post('/execute-code', async (req, res) => {
  try {
    const { code, devices } = req.body;
    if (!code || !devices?.length) {
      return res.status(400).json({ error: 'Code and target devices are required' });
    }

    const result = await executeCode(code, devices);

    // Store execution history in MongoDB
    const { db } = await connectToDatabase();
    await db.collection('execution_history').insertOne({
      code,
      devices,
      result,
      timestamp: new Date()
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

router.get('/execution-history', async (req, res) => {
  try {
    const cachedHistory = await redis.get('execution:history');
    if (cachedHistory) {
      return res.json(JSON.parse(cachedHistory));
    }

    const { db } = await connectToDatabase();
    const history = await db.collection('execution_history')
      .find()
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    await redis.set('execution:history', JSON.stringify(history), 'EX', 60); // Cache for 1 minute
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch execution history' });
  }
});

export default router;