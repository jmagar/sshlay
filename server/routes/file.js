import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const directoryPath = req.query.path || '/';
    const files = await fs.readdir(directoryPath);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      })
    );
    res.json(fileStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/content', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
