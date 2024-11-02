import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { stdout } = await execAsync('journalctl -n 100 --no-pager');
    res.json({ logs: stdout.split('\n') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/service/:name', async (req, res) => {
  try {
    const { stdout } = await execAsync(`journalctl -u ${req.params.name} -n 100 --no-pager`);
    res.json({ logs: stdout.split('\n') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
