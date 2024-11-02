import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();

router.get('/containers', async (req, res) => {
  try {
    const { stdout } = await execAsync('docker ps --format "{{json .}}"');
    const containers = stdout.trim().split('\n').map(line => JSON.parse(line));
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/containers/:id/start', async (req, res) => {
  try {
    await execAsync(`docker start ${req.params.id}`);
    res.json({ message: 'Container started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/containers/:id/stop', async (req, res) => {
  try {
    await execAsync(`docker stop ${req.params.id}`);
    res.json({ message: 'Container stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
