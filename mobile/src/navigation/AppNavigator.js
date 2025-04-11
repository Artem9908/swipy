import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import axios from 'axios';
import { Platform, AppState } from 'react-native';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Функция для создания вкладок
function MainTabs({ route }) {
  const { user } = route.params || {};
  
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
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Discover') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Reservations') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
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
        name="Profile" 
        component={ProfileScreen}
        initialParams={{ user }}
      />
    </Tab.Navigator>
  );
}

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
          component={MainTabs} 
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}