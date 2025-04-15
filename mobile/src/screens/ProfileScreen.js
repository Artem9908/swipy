import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  SafeAreaView,
  Platform,
  ImageBackground,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import axios from 'axios';

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

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [150, 100],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });

  const avatarSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 50],
    extrapolate: 'clamp'
  });

  const avatarMarginTop = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [90, 60],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    if (userData && userData._id && userData._id !== 'guest') {
      fetchUserFavorites();
    }
  }, [userData._id]);

  const fetchUserFavorites = async () => {
    try {
      const baseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001' 
        : 'http://192.168.0.82:5001';
      
      const getLikesUrl = `${baseUrl}/api/users/${userData._id}/likes`;
      console.log('Fetching user favorites from:', getLikesUrl);
      
      const response = await axios.get(getLikesUrl);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`User has ${response.data.length} favorites`);
        setUserData(prevData => ({
          ...prevData,
          favorites: response.data
        }));
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  };

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
      <Animated.View style={[styles.headerBackground, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
            style={styles.headerImage}
            resizeMode="cover"
            blurRadius={1}
          >
            <View style={styles.headerOverlay} />
            <TouchableOpacity style={styles.settingsButton} onPress={() => Alert.alert('Coming Soon', 'Settings will be available in the next update')}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </ImageBackground>
        </Animated.View>
      </Animated.View>

      <Animated.Image 
        source={{ uri: userData.avatar || 'https://ui-avatars.com/api/?name=User&background=4ecdc4&color=fff' }} 
        style={[
          styles.avatar, 
          { 
            width: avatarSize, 
            height: avatarSize, 
            borderRadius: 50,
            marginTop: avatarMarginTop
          }
        ]} 
      />
      
      <View style={styles.profileNameSection}>
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
        <TouchableOpacity style={styles.editButton} onPress={editProfile}>
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.content}>
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
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={goToFriends}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.green.pale }]}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuText}>Friends</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('SavedRestaurants', { user: userData })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FFEBF0' }]}>
                <Ionicons name="heart" size={20} color="#FF4081" />
              </View>
              <Text style={styles.menuText}>Favorite Restaurants</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('FinalChoice', { user: userData })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FFF9C4' }]}>
                <Ionicons name="restaurant" size={20} color="#FFC107" />
              </View>
              <Text style={styles.menuText}>My Selected Restaurant</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={async () => {
                console.log("BUTTON PRESSED - Reset Favorites");
                
                // Check if user has a valid ID first
                if (!userData || !userData._id) {
                  console.log("ERROR - Missing user ID");
                  return;
                }

                // Check if user is a guest
                if (userData._id === 'guest') {
                  console.log("ERROR - Guest user");
                  return;
                }

                try {
                  console.log(`Starting favorites reset for user ${userData._id}`);
                  
                  // Get user's favorites using axios which is known to work
                  const baseUrl = Platform.OS === 'web' 
                    ? 'http://localhost:5001' 
                    : 'http://192.168.0.82:5001';
                  
                  // Get all favorites
                  console.log(`Fetching favorites from ${baseUrl}/api/users/${userData._id}/likes`);
                  const response = await axios.get(`${baseUrl}/api/users/${userData._id}/likes`);
                  console.log('GET favorites response:', response.data);
                  
                  if (response.data && Array.isArray(response.data)) {
                    const favorites = response.data;
                    console.log(`Found ${favorites.length} favorites to delete`);
                    
                    if (favorites.length === 0) {
                      console.log("No favorites to delete");
                      return;
                    }
                    
                    let deletedCount = 0;
                    
                    // Delete each favorite one by one (working with the existing API)
                    for (const favorite of favorites) {
                      if (favorite.restaurantId) {
                        try {
                          const deleteUrl = `${baseUrl}/api/users/${userData._id}/likes/${favorite.restaurantId}`;
                          console.log(`Deleting favorite: ${favorite.restaurantName} (${favorite.restaurantId})`);
                          
                          const deleteResponse = await axios.delete(deleteUrl);
                          console.log("Delete response:", deleteResponse.data);
                          deletedCount++;
                        } catch (deleteError) {
                          console.error(`Failed to delete: ${favorite.restaurantName}`, deleteError);
                        }
                      }
                    }
                    
                    console.log(`Successfully deleted ${deletedCount} favorites`);
                    
                    // Update UI
                    setUserData(prevData => {
                      console.log("Updating userData state - clearing favorites");
                      return {
                        ...prevData,
                        favorites: []
                      };
                    });
                    
                    console.log("Favorites reset complete");
                  } else {
                    console.error("Invalid response format", response.data);
                  }
                } catch (error) {
                  console.error('Error clearing favorites:', error);
                }
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="refresh" size={20} color="#00BCD4" />
              </View>
              <Text style={styles.menuText}>Reset Favorite Restaurants</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>More</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="star" size={20} color="#5C6BC0" />
              </View>
              <Text style={styles.menuText}>My Reviews</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="notifications" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="help-circle" size={20} color="#FF9800" />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
          </View>
          
          {/* Кнопка выхода */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.versionText}>Swipy v1.0</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.medium,
  },
  headerContent: {
    height: '100%',
    width: '100%',
  },
  headerImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  settingsButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  avatar: {
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
    ...SHADOWS.medium,
    zIndex: 2,
  },
  profileNameSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: SIZES.padding.lg,
    zIndex: 2,
  },
  userName: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.xs,
  },
  userEmail: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radius.round,
    marginTop: SIZES.padding.xs,
  },
  editButtonText: {
    color: '#fff',
    ...FONTS.body,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 170,  // Reduced space for header and avatar
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.padding.lg,
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding.lg,
    borderRadius: SIZES.radius.lg,
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
    height: '60%',
    alignSelf: 'center',
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text.secondary,
    marginHorizontal: SIZES.padding.lg,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.xs,
  },
  menuContainer: {
    backgroundColor: COLORS.background,
    marginTop: SIZES.padding.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.md,
    marginHorizontal: SIZES.padding.lg,
    marginVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.md,
  },
  menuText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.padding.lg,
    marginTop: SIZES.padding.xl,
    marginBottom: SIZES.padding.md,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutIcon: {
    marginRight: SIZES.padding.xs,
  },
  logoutText: {
    ...FONTS.body,
    color: COLORS.error,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: SIZES.padding.xl,
    marginTop: SIZES.padding.md,
  },
  versionText: {
    ...FONTS.small,
    color: COLORS.text.light,
  }
}); 