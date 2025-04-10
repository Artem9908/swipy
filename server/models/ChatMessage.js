const mongoose = require('../config/db');
const ChatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ChatMessage', ChatMessageSchema);