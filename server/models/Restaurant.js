const mongoose = require('../config/db');
const RestaurantSchema = new mongoose.Schema({
  name: String,
  cuisine: String,
  priceRange: String,
  rating: Number,
  location: String,
  image: String,
  vegetarian: Boolean,
  vegan: Boolean,
  glutenFree: Boolean,
  openNow: Boolean,
  coordinates: {
    latitude: Number,
    longitude: Number
  }
});
module.exports = mongoose.model('Restaurant', RestaurantSchema);