import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import { COLORS, FONTS, SIZES } from '../styles/theme';

const NotificationsScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearAllNotifications,
    addTestNotification 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Имитация загрузки данных
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  // Функция обновления
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Обработка нажатия на уведомление
  const handleNotificationPress = (notification) => {
    console.log('Notification pressed:', notification);
    
    // Отмечаем уведомление как прочитанное
    markAsRead(notification.id);
    
    // Получаем данные из уведомления
    const data = notification.data || {};
    
    // Навигация в зависимости от типа уведомления
    switch (notification.type) {
      case 'match':
        console.log('Navigating to Matches screen');
        navigation.navigate('Matches');
        break;
      case 'message':
        console.log('Navigating to Chat screen with friendId:', data.friendId);
        if (data.friendId) {
          navigation.navigate('Chat', { 
            user, 
            friendId: data.friendId 
          });
        } else {
          console.error('No friendId found in notification data:', data);
          // Если нет friendId, просто переходим на экран чата
          navigation.navigate('Chat', { user });
        }
        break;
      case 'invitation':
        console.log('Navigating to RestaurantDetail screen with restaurantId:', data.restaurantId);
        if (data.restaurantId) {
          navigation.navigate('RestaurantDetail', { 
            restaurant: { _id: data.restaurantId },
            user
          });
        } else {
          console.error('No restaurantId found in notification data:', data);
          // Если нет restaurantId, просто переходим на экран ресторанов
          navigation.navigate('Discover');
        }
        break;
      default:
        break;
    }
  };

  // Рендер пустого списка
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={60} color={COLORS.text.light} />
      <Text style={styles.emptyText}>У вас пока нет уведомлений</Text>
    </View>
  );

  // Рендер заголовка списка
  const renderListHeader = () => {
    if (notifications.length === 0) return null;
    
    return (
      <View style={styles.listHeader}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={markAllAsRead}
        >
          <Text style={styles.headerButtonText}>Прочитать все</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={clearAllNotifications}
        >
          <Text style={styles.headerButtonText}>Очистить все</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
            onDismiss={removeNotification}
          />
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyList}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.lg,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.text.light,
    marginTop: SIZES.padding.md,
    marginBottom: SIZES.padding.lg,
    textAlign: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    paddingVertical: SIZES.padding.xs,
    paddingHorizontal: SIZES.padding.sm,
    backgroundColor: 'transparent',
  },
  headerButtonText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default NotificationsScreen; 