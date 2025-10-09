const express = require('express');
const { smartReplies, summarize, moderate } = require('../services/gemini');

const router = express.Router();

router.post('/smart-replies', async (req, res) => {
  try {
    const { messages } = req.body || {};
    const suggestions = await smartReplies(messages || []);
    res.json({ suggestions });
  } catch (err) {
    console.error('[ai] smart-replies error', err?.response?.data || err.message);
    res.status(500).json({ error: 'smart_replies_failed' });
  }
});

router.post('/summarize', async (req, res) => {
  try {
    const { messages } = req.body || {};
    const summary = await summarize(messages || []);
    res.json({ summary });
  } catch (err) {
    console.error('[ai] summarize error', err?.response?.data || err.message);
    res.status(500).json({ error: 'summarize_failed' });
  }
});

router.post('/moderate', async (req, res) => {
  try {
    const { text } = req.body || {};
    const result = await moderate(text || '');
    res.json(result);
  } catch (err) {
    console.error('[ai] moderate error', err?.response?.data || err.message);
    res.status(500).json({ error: 'moderate_failed' });
  }
});

module.exports = router;
