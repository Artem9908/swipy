const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find(req.query);
    res.json(restaurants);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.json(restaurant);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;