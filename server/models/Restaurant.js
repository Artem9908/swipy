const mongoose = require('../config/db');
const RestaurantSchema = new mongoose.Schema({
  name: String,
  cuisine: String,
  priceRange: String,
  rating: Number,
  location: String,
  image: String
});
module.exports = mongoose.model('Restaurant', RestaurantSchema);