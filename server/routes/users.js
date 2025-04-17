const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    // Check if required fields are provided
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Name, username, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists', 
        message: 'A user with this username already exists' 
      });
    }

    // Create and save the new user
    const user = new User({ name, username, password });
    await user.save();
    
    // Return user data without password
    const userData = user.toObject();
    delete userData.password;
    
    res.status(201).json(userData);
  } catch(e) {
    console.error('Registration error:', e);
    res.status(400).json({ error: e.message, message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne(req.body);
    if(!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Return user data without password
    const userData = user.toObject();
    delete userData.password;
    
    res.json(userData);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
