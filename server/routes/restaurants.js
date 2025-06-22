const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

router.get('/', async (req, res) => {
  try {
    const {
      location,
      cuisine,
      priceRange,
      minRating,
      vegetarian,
      vegan,
      glutenFree,
      openNow,
      radius,
      latitude,
      longitude
    } = req.query;

    let query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (cuisine && cuisine !== 'all') {
      query.cuisine = cuisine;
    }
    if (priceRange && priceRange !== 'all') {
      query.priceRange = priceRange;
    }
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    if (vegetarian === 'true') {
      query.vegetarian = true;
    }
    if (vegan === 'true') {
      query.vegan = true;
    }
    if (glutenFree === 'true') {
      query.glutenFree = true;
    }
    if (openNow === 'true') {
      query.openNow = true;
    }

    // If radius and coordinates are provided, use geospatial filtering
    let restaurants;
    if (radius && latitude && longitude) {
      const all = await Restaurant.find(query);
      const r = Number(radius);
      const lat = Number(latitude);
      const lng = Number(longitude);
      restaurants = all.filter(rest => {
        if (!rest.coordinates || !rest.coordinates.latitude || !rest.coordinates.longitude) return false;
        const dLat = (rest.coordinates.latitude - lat) * Math.PI / 180;
        const dLng = (rest.coordinates.longitude - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(rest.coordinates.latitude * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = 6371000 * c; // meters
        return distance <= r;
      });
    } else {
      restaurants = await Restaurant.find(query);
    }
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