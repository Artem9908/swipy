const userSchema = new mongoose.Schema({
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  lastSwipedAt: {
    type: Date,
    default: null
  }
}); 