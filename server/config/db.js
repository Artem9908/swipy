const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/restaurant-app', { useNewUrlParser: true, useUnifiedTopology: true });
module.exports = mongoose;