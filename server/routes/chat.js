const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

router.get('/', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const message = new ChatMessage(req.body);
    await message.save();
    res.json(message);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;