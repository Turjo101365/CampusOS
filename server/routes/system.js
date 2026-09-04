import express from 'express';
import { getStats, resetToSeed } from '../db/storage.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reset', (req, res) => {
  try {
    const result = resetToSeed();
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
