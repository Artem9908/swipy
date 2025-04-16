const Notification = require('../models/Notification');
const User = require('../models/User');
const { Expo } = require('expo-server-sdk');

// Инициализация экземпляра Expo SDK
const expo = new Expo();

// Получение уведомлений для пользователя
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    
    // Преобразуем уведомления в формат, понятный клиенту
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      read: notification.read,
      createdAt: notification.createdAt
    }));
    
    return res.status(200).json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// Отметка уведомления как прочитанного
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

// Отметка всех уведомлений пользователя как прочитанных
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );
    
    return res.status(200).json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};

// Удаление уведомления
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

// Удаление всех уведомлений пользователя
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await Notification.deleteMany({ recipientId: userId });
    
    return res.status(200).json({ 
      message: 'All notifications cleared successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
  }
};

// Отправка уведомления пользователю
exports.sendNotification = async (userId, title, body, notificationType, data = {}) => {
  try {
    // Находим пользователя для получения push-токена
    const user = await User.findById(userId);
    
    if (!user || !user.pushToken) {
      console.log(`Cannot send notification: User ${userId} not found or has no push token`);
      return;
    }
    
    // Создаем объект уведомления для сохранения в базе данных
    const notification = new Notification({
      recipientId: userId,
      title,
      body,
      type: notificationType,
      data,
      read: false
    });
    
    // Сохраняем уведомление в базе данных
    await notification.save();
    
    // Проверяем валидность токена
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.log(`Push token ${user.pushToken} is not a valid Expo push token`);
      return;
    }
    
    // Создаем сообщение для отправки через Expo
    const message = {
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        notificationId: notification._id,
        type: notificationType
      }
    };
    
    // Отправляем уведомление
    const chunks = expo.chunkPushNotifications([message]);
    
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
};

// Отправка тестового уведомления о новом совпадении
exports.sendTestMatchNotification = async (req, res) => {
  try {
    const { userId, friendId, restaurantId, restaurantName } = req.body;
    
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Missing required parameters: userId and friendId' });
    }
    
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    // Создаем более информативное сообщение, если известно название ресторана
    const messageBody = restaurantName 
      ? `У вас с ${friend.name || friend.username} совпал ресторан ${restaurantName}!`
      : `У вас новое совпадение с ${friend.name || friend.username}`;
    
    const notification = await exports.sendNotification(
      userId,
      'Новое совпадение!',
      messageBody,
      'match',
      { 
        friendId,
        restaurantId: restaurantId || null,
        screen: 'Matches',
        params: { initialFriendId: friendId }
      }
    );
    
    return res.status(200).json({ message: 'Test match notification sent', notification });
  } catch (error) {
    console.error('Error sending test match notification:', error);
    return res.status(500).json({ message: 'Failed to send test notification', error: error.message });
  }
};

// Отправка тестового уведомления о новом сообщении
exports.sendTestMessageNotification = async (req, res) => {
  try {
    const { userId, friendId, message } = req.body;
    
    if (!userId || !friendId || !message) {
      return res.status(400).json({ message: 'Missing required parameters: userId, friendId, and message' });
    }
    
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    const notification = await exports.sendNotification(
      userId,
      `Новое сообщение от ${friend.name || friend.username}`,
      message.length > 100 ? message.substring(0, 97) + '...' : message,
      'message',
      { 
        friendId, 
        message,
        screen: 'Chat',
        params: { friendId }
      }
    );
    
    return res.status(200).json({ message: 'Test message notification sent', notification });
  } catch (error) {
    console.error('Error sending test message notification:', error);
    return res.status(500).json({ message: 'Failed to send test notification', error: error.message });
  }
};

// Отправка тестового уведомления о приглашении в ресторан
exports.sendTestInvitationNotification = async (req, res) => {
  try {
    const { userId, friendId, restaurantId } = req.body;
    
    if (!userId || !friendId || !restaurantId) {
      return res.status(400).json({ message: 'Missing required parameters: userId, friendId, and restaurantId' });
    }
    
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    const notification = await exports.sendNotification(
      userId,
      'Приглашение в ресторан',
      `${friend.name} приглашает вас в ресторан`,
      'invitation',
      { friendId, restaurantId }
    );
    
    return res.status(200).json({ message: 'Test invitation notification sent', notification });
  } catch (error) {
    console.error('Error sending test invitation notification:', error);
    return res.status(500).json({ message: 'Failed to send test notification', error: error.message });
  }
}; 