const express = require('express');
const { executeCode } = require('../lib/codeExecution');
const { getDevices, addDevice } = require('../lib/devices');
const { getContainers, performContainerAction } = require('../lib/docker');
const { addSSHConnection } = require('../lib/ssh');
const redis = require('../redis');

const router = express.Router();

router.post('/execute-code', async (req, res) => {
  try {
    const { code, devices } = req.body;
    const result = await executeCode(code, devices);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

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

router.get('/docker-containers', async (req, res) => {
  try {
    const cachedContainers = await redis.get('containers');
    if (cachedContainers) {
      return res.json(JSON.parse(cachedContainers));
    }
    const containers = await getContainers();
    await redis.set('containers', JSON.stringify(containers), 'EX', 60); // Cache for 1 minute
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

router.post('/docker-containers/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    await performContainerAction(id, action);
    await redis.del('containers'); // Invalidate cache
    res.json({ message: `Action ${action} performed on container ${id}` });
  } catch (error) {
    res.status(500).json({ error: `Failed to ${req.params.action} container` });
  }
});

router.post('/ssh-connections', async (req, res) => {
  try {
    await addSSHConnection(req.body);
    res.status(201).json({ message: 'SSH connection added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add SSH connection' });
  }
});

module.exports = router;