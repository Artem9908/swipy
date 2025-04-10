const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne(req.body);
    if(!user) return res.status(400).json({ error: 'Invalid credentials' });
    res.json(user);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
