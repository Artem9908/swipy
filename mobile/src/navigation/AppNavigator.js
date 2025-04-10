import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Функция для создания вкладок
function MainTabs({ route }) {
  const { user } = route.params || {};
  
  // Log user data to verify it's being passed correctly
  console.log("MainTabs received user data:", user);
  
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
            title: route.params.restaurant.name,
            headerTransparent: true,
            headerTintColor: '#fff',
            headerBackTitle: ' ',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}