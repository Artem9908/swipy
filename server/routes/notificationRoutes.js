const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Получение уведомлений пользователя
router.get('/user/:userId', authMiddleware, notificationController.getUserNotifications);

// Отметка уведомления как прочитанного
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);

// Отметка всех уведомлений пользователя как прочитанных
router.put('/user/:userId/read-all', authMiddleware, notificationController.markAllAsRead);

// Удаление уведомления
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

// Удаление всех уведомлений пользователя
router.delete('/user/:userId/clear-all', authMiddleware, notificationController.clearAllNotifications);

// Тестовые маршруты для отправки уведомлений
router.post('/test/match', notificationController.sendTestMatchNotification);
router.post('/test/message', notificationController.sendTestMessageNotification);
router.post('/test/invitation', notificationController.sendTestInvitationNotification);

module.exports = router; 