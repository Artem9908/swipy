const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const notificationController = require('../controllers/notificationController');

router.get('/', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

// Получение сообщений между двумя пользователями
router.get('/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    
    const messages = await ChatMessage.find({
      $or: [
        { userId: userId, recipientId: friendId },
        { userId: friendId, recipientId: userId }
      ]
    }).sort({ timestamp: 1 });
    
    res.json(messages);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, recipientId, text } = req.body;
    const message = new ChatMessage(req.body);
    await message.save();
    
    // Отправляем уведомление о новом сообщении получателю
    if (userId !== 'system' && recipientId) {
      try {
        const sender = await User.findById(userId);
        if (sender) {
          // Отправляем уведомление о новом сообщении
          await notificationController.sendNotification(
            recipientId,
            `Новое сообщение от ${sender.name || sender.username}`,
            text.length > 100 ? text.substring(0, 97) + '...' : text,
            'message',
            { 
              friendId: userId,
              messageId: message._id,
              message: text,
              screen: 'Chat',
              params: { friendId: userId }
            }
          );
          console.log('Message notification sent to', recipientId);
        }
      } catch (error) {
        console.error('Error sending message notification:', error);
      }
    }
    
    res.json(message);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;