import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import axios from 'axios';
import { Platform, AppState, View, Text } from 'react-native';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import NotificationBanner from '../components/NotificationBanner';

// Импортируем экраны
import LoginScreen from '../screens/LoginScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import ReservationScreen from '../screens/ReservationScreen';
import FilterScreen from '../screens/FilterScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReservationsListScreen from '../screens/ReservationsListScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SavedRestaurantsScreen from '../screens/SavedRestaurantsScreen';
import TournamentScreen from '../screens/TournamentScreen';
import MatchesScreen from '../screens/MatchesScreen';
import FinalChoiceScreen from '../screens/FinalChoiceScreen';
import TournamentWinnersScreen from '../screens/TournamentWinnersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Компонент для отображения счетчика непрочитанных уведомлений
const TabBarIcon = ({ focused, color, name, badgeCount }) => {
  return (
    <View>
      <Ionicons name={name} size={24} color={color} />
      {badgeCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -6,
          right: -10,
          backgroundColor: COLORS.error,
          borderRadius: 10,
          minWidth: 18,
          height: 18,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{
            color: '#FFF',
            fontSize: 10,
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

// Функция для создания вкладок
function MainTabs({ route }) {
  const { user } = route.params || {};
  const { activeNotification, unreadCount, markAsRead } = useNotifications();
  const navigation = useNavigation();
  
  // Log user data to verify it's being passed correctly
  console.log("MainTabs received user data:", user);
  
  // Обновление онлайн-статуса пользователя
  useEffect(() => {
    if (!user || !user._id) return;
    
    // Начальное обновление статуса (пользователь онлайн)
    updateUserOnlineStatus(user._id, true);
    
    // Настройка слушателя состояния приложения
    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        // Обновляем статус в зависимости от состояния приложения
        const isOnline = nextAppState === 'active';
        updateUserOnlineStatus(user._id, isOnline);
      }
    );
    
    // Регулярное обновление статуса, пока приложение активно
    const heartbeatInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        updateUserOnlineStatus(user._id, true);
      }
    }, 60000); // Каждую минуту обновляем статус
    
    // Очистка при размонтировании
    return () => {
      updateUserOnlineStatus(user._id, false);
      appStateSubscription.remove();
      clearInterval(heartbeatInterval);
    };
  }, [user]);
  
  // Функция для обновления онлайн-статуса
  const updateUserOnlineStatus = (userId, isOnline) => {
    const statusApiUrl = Platform.OS === 'web' 
      ? `http://localhost:5001/api/users/${userId}/status` 
      : `http://192.168.0.82:5001/api/users/${userId}/status`;
      
    axios.put(statusApiUrl, { isOnline })
      .catch(e => console.error('Error updating online status:', e));
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
        console.log('Navigating to Notifications screen');
        navigation.navigate('Notifications');
        break;
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            
            if (route.name === 'Discover') {
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            } else if (route.name === 'Reservations') {
              iconName = focused ? 'calendar' : 'calendar-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            } else if (route.name === 'Friends') {
              iconName = focused ? 'people' : 'people-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            } else if (route.name === 'Matches') {
              iconName = focused ? 'heart' : 'heart-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            } else if (route.name === 'Notifications') {
              iconName = focused ? 'notifications' : 'notifications-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={unreadCount} />;
            } else if (route.name === 'Test') {
              iconName = focused ? 'bug' : 'bug-outline';
              return <TabBarIcon focused={focused} color={color} name={iconName} badgeCount={0} />;
            }
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.text.secondary,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          tabBarLabelStyle: {
            ...FONTS.caption,
          },
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.text.inverse,
          headerTitleStyle: {
            ...FONTS.h2,
          },
        })}
      >
        <Tab.Screen 
          name="Discover" 
          component={RestaurantListScreen}
          initialParams={{ user }}
          options={{ title: 'Discover' }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          initialParams={{ user }}
        />
        <Tab.Screen 
          name="Reservations" 
          component={ReservationsListScreen}
          initialParams={{ user }}
        />
        <Tab.Screen 
          name="Friends" 
          component={FriendsScreen}
          initialParams={{ user }}
        />
        <Tab.Screen 
          name="Matches" 
          component={MatchesScreen}
          initialParams={{ user }}
        />
        <Tab.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          initialParams={{ user }}
          options={{ 
            title: 'Уведомления',
            tabBarBadge: unreadCount > 0 ? unreadCount : null 
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          initialParams={{ user }}
        />
      </Tab.Navigator>
      
      {/* Отображение всплывающего уведомления */}
      {activeNotification && (
        <NotificationBanner 
          notification={activeNotification}
          onPress={handleNotificationPress}
        />
      )}
    </View>
  );
}

// Главный компонент навигации, обернутый в контекст уведомлений
const MainNavigator = ({ route }) => {
  const { user } = route.params || {};
  
  return (
    <NotificationProvider userId={user?._id}>
      <MainTabs route={route} />
    </NotificationProvider>
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.text.inverse,
          headerTitleStyle: {
            ...FONTS.h2,
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Main" 
          component={MainNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RestaurantDetail" 
          component={RestaurantDetailScreen} 
          options={({ route }) => ({ 
            headerShown: false,
          })}
        />
        <Stack.Screen 
          name="Reservation" 
          component={ReservationScreen} 
          options={{ title: 'Make a Reservation' }}
        />
        <Stack.Screen 
          name="Filters" 
          component={FilterScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="SavedRestaurants" 
          component={SavedRestaurantsScreen} 
          options={{ title: 'Favorite Restaurants' }}
        />
        <Stack.Screen 
          name="Tournament" 
          component={TournamentScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FinalChoice" 
          component={FinalChoiceScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TournamentWinners" 
          component={TournamentWinnersScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}