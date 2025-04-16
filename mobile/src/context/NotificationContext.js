import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform, AppState, Alert } from 'react-native';

// Создаем контекст
export const NotificationContext = createContext();

// Кастомный хук для использования контекста
export const useNotifications = () => useContext(NotificationContext);

// API URL в зависимости от платформы
const getApiUrl = () => {
  return Platform.OS === 'web' 
    ? 'http://localhost:5001/api' 
    : 'http://192.168.0.82:5001/api';
};

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeNotification, setActiveNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);

  // Загрузка уведомлений из локального хранилища при инициализации
  useEffect(() => {
    if (!userId) return;
    
    loadNotifications();
    
    // Устанавливаем интервал для периодической проверки новых уведомлений
    const interval = setInterval(() => {
      if (appState === 'active') {
        console.log('Fetching notifications (interval)...');
        fetchNotifications();
      }
    }, 10000); // каждые 10 секунд
    
    // Обработчик изменения состояния приложения
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      console.log('App state changed to:', nextAppState);
      setAppState(nextAppState);
      
      // Если приложение вернулось в активное состояние, обновляем уведомления
      if (nextAppState === 'active') {
        console.log('App is active, fetching notifications...');
        fetchNotifications();
      }
    });
    
    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [userId, appState]);

  // Обновляем счетчик непрочитанных уведомлений при изменении списка
  useEffect(() => {
    const count = notifications.filter(notif => !notif.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Загрузка уведомлений из локального хранилища
  const loadNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(`@notifications:${userId}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
      fetchNotifications();
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  };

  // Сохранение уведомлений в локальное хранилище
  const saveNotifications = async (updatedNotifications) => {
    try {
      await AsyncStorage.setItem(
        `@notifications:${userId}`, 
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  };

  // Получение уведомлений с сервера
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      console.log(`Fetching notifications for user ${userId}`);
      const response = await axios.get(`${getApiUrl()}/notifications/user/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} notifications from server`);
        
        // Форматируем полученные уведомления
        const formattedNotifications = response.data.map(notification => ({
          id: notification._id || String(Date.now()),
          type: notification.type,
          message: notification.title || notification.body,
          body: notification.body,
          createdAt: notification.createdAt,
          read: notification.read,
          data: notification.data || {}
        }));
        
        // Проверяем, есть ли новые уведомления
        const currentIds = notifications.map(n => n.id);
        const newNotifications = formattedNotifications.filter(n => !currentIds.includes(n.id));
        
        if (newNotifications.length > 0) {
          console.log(`Found ${newNotifications.length} new notifications:`, newNotifications);
          
          // Объединяем с существующими уведомлениями
          const updatedNotifications = [...newNotifications, ...notifications];
          setNotifications(updatedNotifications);
          saveNotifications(updatedNotifications);
          
          // Показываем новое уведомление
          if (newNotifications.length === 1) {
            showNotification(newNotifications[0]);
          } else if (newNotifications.length > 1) {
            // Если несколько новых уведомлений, показываем сводное уведомление
            const summaryNotification = {
              id: Date.now().toString(),
              type: 'summary',
              message: `У вас ${newNotifications.length} новых уведомлений`,
              createdAt: new Date().toISOString(),
              read: false
            };
            showNotification(summaryNotification);
          }
        } else {
          console.log('No new notifications found');
        }
      } else {
        console.log('No notifications received from server or invalid format');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Показать всплывающее уведомление
  const showNotification = (notification) => {
    console.log('Showing notification:', notification);
    setActiveNotification(notification);
    
    // Воспроизводим звук уведомления на устройстве
    if (Platform.OS !== 'web') {
      try {
        // Вибрация могла бы быть добавлена здесь при необходимости
        // Vibration.vibrate();
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
      setActiveNotification(null);
    }, 5000);
  };

  // Отметить уведомление как прочитанное
  const markAsRead = async (notificationId) => {
    try {
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      
      setNotifications(updatedNotifications);
      saveNotifications(updatedNotifications);
      
      // Обновляем на сервере
      await axios.put(`${getApiUrl()}/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Отметить все уведомления как прочитанные
  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      saveNotifications(updatedNotifications);
      
      // Обновляем на сервере
      await axios.put(`${getApiUrl()}/notifications/user/${userId}/read-all`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Удалить уведомление
  const removeNotification = async (notificationId) => {
    try {
      const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
      setNotifications(updatedNotifications);
      saveNotifications(updatedNotifications);
      
      // Удаляем на сервере
      await axios.delete(`${getApiUrl()}/notifications/${notificationId}`, {
        data: { userId }
      });
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  // Удалить все уведомления
  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      saveNotifications([]);
      
      // Удаляем на сервере
      await axios.delete(`${getApiUrl()}/notifications/user/${userId}/clear-all`);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Добавление нового локального уведомления (для тестирования)
  const addTestNotification = (type, message) => {
    const newNotification = {
      id: Date.now().toString(),
      type,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      data: {
        friendId: '123456', // Тестовый ID друга
        messageId: '789012'  // Тестовый ID сообщения
      }
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
    showNotification(newNotification);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeNotification,
        unreadCount,
        showNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        addTestNotification,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 