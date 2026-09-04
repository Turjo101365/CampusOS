import express from 'express';
import { runAgent } from '../agent/runner.js';
import { toolDefinitions } from '../agent/tools.js';

const router = express.Router();

router.get('/tools', (req, res) => {
  res.json({
    success: true,
    tools: toolDefinitions,
    count: toolDefinitions.length
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid message string is required.'
      });
    }

    const result = await runAgent(message, history || []);
    res.json({
      success: true,
      message: result.text,
      tool_calls: result.tool_calls || [],
      provider: result.provider
    });
  } catch (error) {
    console.error('[Agent Route Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process query with CampusOS agent.'
    });
  }
});

export default router;
