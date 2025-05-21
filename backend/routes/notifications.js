const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { userId, type, message, data, relatedUserId } = req.body;
    
    const notification = new Notification({
      userId,
      type,
      message,
      data,
      relatedUserId,
      read: false
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body; // To verify ownership
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }
    
    await notification.remove();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications for a user
router.delete('/user/:userId/clear-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Notification.deleteMany({ userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ error: 'Failed to clear all notifications' });
  }
});

// Test endpoints for different notification types
router.post('/test/match', async (req, res) => {
  try {
    const { userId, friendId, restaurantId, restaurantName } = req.body;
    
    const notification = new Notification({
      userId,
      type: 'match',
      message: `You and ${friendId} both liked ${restaurantName}!`,
      data: {
        friendId,
        restaurantId,
        restaurantName
      },
      relatedUserId: friendId
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating test match notification:', error);
    res.status(500).json({ error: 'Failed to create test match notification' });
  }
});

router.post('/test/message', async (req, res) => {
  try {
    const { userId, friendId, message } = req.body;
    
    const notification = new Notification({
      userId,
      type: 'message',
      message: message,
      data: {
        friendId,
        messageId: Date.now().toString()
      },
      relatedUserId: friendId
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating test message notification:', error);
    res.status(500).json({ error: 'Failed to create test message notification' });
  }
});

router.post('/test/invitation', async (req, res) => {
  try {
    const { userId, friendId, restaurantId } = req.body;
    
    const notification = new Notification({
      userId,
      type: 'invitation',
      message: `${friendId} invited you to check out a restaurant!`,
      data: {
        friendId,
        restaurantId
      },
      relatedUserId: friendId
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating test invitation notification:', error);
    res.status(500).json({ error: 'Failed to create test invitation notification' });
  }
});

module.exports = router; 