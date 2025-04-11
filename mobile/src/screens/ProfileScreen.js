import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import ActionButton from '../components/ActionButton';

export default function ProfileScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [userData, setUserData] = useState(user || {
    name: 'Guest User',
    email: 'guest@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Guest+User&background=4ecdc4&color=fff',
    favorites: [],
    friends: [],
    reviews: []
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
  };

  const editProfile = () => {
    // Здесь будет навигация к экрану редактирования профиля
    Alert.alert('Coming Soon', 'Profile editing will be available in the next update');
  };

  const goToFriends = () => {
    navigation.navigate('Friends', { user: userData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Шапка профиля */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image 
              source={{ uri: userData.avatar || 'https://ui-avatars.com/api/?name=User&background=4ecdc4&color=fff' }} 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={editProfile}>
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.favorites?.length || 0}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.friends?.length || 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.reviews?.length || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Меню профиля */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={goToFriends}>
            <Ionicons name="people-outline" size={24} color={COLORS.text.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Friends</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('SavedRestaurants', { user })}
          >
            <Ionicons name="heart-outline" size={24} color={COLORS.text.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Favorite Restaurants</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('FinalChoice', { user })}
          >
            <Ionicons name="restaurant-outline" size={24} color={COLORS.text.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>My Selected Restaurant</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="star-outline" size={24} color={COLORS.text.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>My Reviews</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
        </View>
        
        {/* Кнопка выхода */}
        <ActionButton 
          title="Logout" 
          icon="log-out-outline" 
          onPress={handleLogout} 
          type="secondary"
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: SIZES.padding.md,
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    ...FONTS.h2,
    color: COLORS.text.primary,
  },
  userEmail: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
  editButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SIZES.padding.md,
    backgroundColor: COLORS.card,
    marginTop: SIZES.padding.sm,
    ...SHADOWS.small,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...FONTS.h2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  menuContainer: {
    backgroundColor: COLORS.card,
    marginTop: SIZES.padding.md,
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    marginRight: SIZES.padding.md,
  },
  menuText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  logoutButton: {
    margin: SIZES.padding.lg,
  },
}); 