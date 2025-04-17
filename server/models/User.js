const mongoose = require('../config/db');
const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  password: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
module.exports = mongoose.model('User', UserSchema);