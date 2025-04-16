import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

const NotificationBanner = ({ notification, onPress, onDismiss, autoDismiss = true }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация появления
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Автоматически скрыть уведомление через 5 секунд
    if (autoDismiss) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissNotification = () => {
    // Анимация скрытия
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

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

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity
        }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          dismissNotification();
          if (onPress) onPress(notification);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getNotificationIcon()} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.messageText}>{notification.message}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={dismissNotification}
        >
          <Ionicons name="close" size={20} color={COLORS.text.light} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SIZES.padding.md,
    paddingTop: SIZES.padding.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    paddingRight: SIZES.padding.sm,
    ...SHADOWS.medium,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SIZES.padding.xs,
  }
});

export default NotificationBanner; 