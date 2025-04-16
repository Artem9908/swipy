import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

const NotificationItem = ({ notification, onPress, onDismiss }) => {
  // Определяем иконку в зависимости от типа уведомления
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'match':
        return 'heart';
      case 'message':
        return 'chatbubble';
      case 'invitation':
        return 'restaurant';
      default:
        return 'notifications';
    }
  };

  // Форматируем время уведомления
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Если меньше 24 часов, показываем время
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Иначе показываем дату
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        notification.read ? styles.readContainer : styles.unreadContainer
      ]}
      onPress={() => onPress && onPress(notification)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getNotificationIcon()} 
          size={24} 
          color={COLORS.primary}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.messageText}>{notification.message}</Text>
        <Text style={styles.timeText}>{formatTime(notification.createdAt)}</Text>
      </View>
      
      {onDismiss && (
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={() => onDismiss(notification.id)}
        >
          <Ionicons name="close" size={18} color={COLORS.text.light} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  unreadContainer: {
    backgroundColor: COLORS.green.pale,
  },
  readContainer: {
    backgroundColor: COLORS.background,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.md,
  },
  contentContainer: {
    flex: 1,
  },
  messageText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  timeText: {
    ...FONTS.small,
    color: COLORS.text.light,
  },
  dismissButton: {
    padding: SIZES.padding.xs,
  }
});

export default NotificationItem; 