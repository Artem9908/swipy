const mongoose = require('../config/db');
const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  date: Date,
  status: String
});
module.exports = mongoose.model('Reservation', ReservationSchema);
