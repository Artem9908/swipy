import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

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

  // Refs to track previous counts and avoid unnecessary updates
  const prevFavoritesCount = useRef(userData.favorites?.length || 0);
  const prevFriendsCount = useRef(userData.friends?.length || 0);
  
  // Refs to track if fetch operations are in progress
  const isFetchingFavorites = useRef(false);
  const isFetchingFriends = useRef(false);
  
  // Ref for the refresh interval
  const refreshIntervalRef = useRef(null);
  
  // Ref for axios cancel tokens
  const cancelTokenRef = useRef(null);
  
  // Ref to track last update time to prevent too frequent updates
  const lastUpdateTimeRef = useRef({
    favorites: 0,
    friends: 0
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

  // Use focus effect to fetch data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('ProfileScreen focused - refreshing data');
      if (userData && userData._id && userData._id !== 'guest') {
        // Fetch initial data - wait for existing operations to complete
        setTimeout(() => {
          fetchUserData();
        }, 100);
        
        // Set up background refresh that doesn't block UI, using a more reasonable interval
        refreshIntervalRef.current = setInterval(() => {
          fetchUserData();
        }, 3000); // Check every 3 seconds instead of every second
      }
      
      // Cleanup function to clear interval when screen loses focus
      return () => {
        console.log('ProfileScreen lost focus - cleaning up interval');
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        
        // Cancel any pending requests
        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel('Component unmounted');
          cancelTokenRef.current = null;
        }
      };
    }, [userData._id])
  );

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      // Cancel any pending requests
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
        cancelTokenRef.current = null;
      }
    };
  }, []);

  // Combined function to fetch all user data efficiently
  const fetchUserData = async () => {
    fetchUserFavorites();
    fetchUserFriends();
  };

  const fetchUserFavorites = async () => {
    // Skip if already fetching to prevent parallel calls
    if (isFetchingFavorites.current) return;
    
    // Rate limiting - only allow updates every 3 seconds at minimum
    const now = Date.now();
    if (now - lastUpdateTimeRef.current.favorites < 3000) {
      console.log('Skipping favorites update due to rate limiting');
      return;
    }
    
    // Cancel any existing requests
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation canceled due to new request');
    }
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    isFetchingFavorites.current = true;
    lastUpdateTimeRef.current.favorites = now;
    
    try {
      const baseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001' 
        : 'http://192.168.0.82:5001';
      
      const getLikesUrl = `${baseUrl}/api/users/${userData._id}/likes`;
      
      const response = await axios.get(getLikesUrl, {
        cancelToken: cancelTokenRef.current.token
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Only update if count has changed to avoid unnecessary renders
        if (response.data.length !== prevFavoritesCount.current) {
          console.log(`Favorites count changed: ${prevFavoritesCount.current} -> ${response.data.length}`);
          prevFavoritesCount.current = response.data.length;
          
          setUserData(prevData => ({
            ...prevData,
            favorites: response.data
          }));
        }
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching user favorites:', error);
      }
    } finally {
      isFetchingFavorites.current = false;
    }
  };

  const fetchUserFriends = async () => {
    // Skip if already fetching to prevent parallel calls
    if (isFetchingFriends.current) return;
    
    // Rate limiting - only allow updates every 3 seconds at minimum
    const now = Date.now();
    if (now - lastUpdateTimeRef.current.friends < 3000) {
      console.log('Skipping friends update due to rate limiting');
      return;
    }
    
    // Cancel any existing requests
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation canceled due to new request');
    }
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    isFetchingFriends.current = true;
    lastUpdateTimeRef.current.friends = now;
    
    try {
      const baseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001' 
        : 'http://192.168.0.82:5001';
      
      const getFriendsUrl = `${baseUrl}/api/users/${userData._id}/friends`;
      
      const response = await axios.get(getFriendsUrl, {
        cancelToken: cancelTokenRef.current.token
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Only update if count has changed to avoid unnecessary renders
        if (response.data.length !== prevFriendsCount.current) {
          console.log(`Friends count changed: ${prevFriendsCount.current} -> ${response.data.length}`);
          prevFriendsCount.current = response.data.length;
          
          setUserData(prevData => ({
            ...prevData,
            friends: response.data
          }));
        }
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching user friends:', error);
      }
    } finally {
      isFetchingFriends.current = false;
    }
  };

  const handleLogout = () => {
    console.log("handleLogout function called");
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled')
        },
        {
          text: 'Logout',
          onPress: async () => {
            console.log('Logout confirmed');
            try {
              // Call logout API if user has a valid ID
              if (userData && userData._id && userData._id !== 'guest') {
                const baseUrl = Platform.OS === 'web' 
                  ? 'http://localhost:5001' 
                  : 'http://192.168.0.82:5001';
                
                console.log(`Calling logout API at ${baseUrl}/api/users/logout`);
                await axios.post(`${baseUrl}/api/users/logout`, { userId: userData._id });
                console.log('Logout API called successfully');
              }
              
              // Reset the navigation stack to the Login screen
              console.log('Resetting navigation to Login screen');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              // Still navigate to login even if API call fails
              console.log('Error during logout, still navigating to Login');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  const editProfile = () => {
    // Здесь будет навигация к экрану редактирования профиля
    Alert.alert('Coming Soon', 'Profile editing will be available in the next update');
  };

  const goToFriends = () => {
    navigation.navigate('Friends', { user: userData });
  };

  const directLogout = async () => {
    console.log("Direct logout function called");
    try {
      // Call logout API if user has a valid ID
      if (userData && userData._id && userData._id !== 'guest') {
        const baseUrl = Platform.OS === 'web' 
          ? 'http://localhost:5001' 
          : 'http://192.168.0.82:5001';
        
        console.log(`Calling logout API at ${baseUrl}/api/users/logout`);
        await axios.post(`${baseUrl}/api/users/logout`, { userId: userData._id });
        console.log('Logout API called successfully');
      }
      
      // Reset the navigation stack to the Login screen
      console.log('Resetting navigation to Login screen');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if API call fails
      console.log('Error during logout, still navigating to Login');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
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

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.Image 
          source={{ uri: userData.avatar || 'https://ui-avatars.com/api/?name=User&background=4ecdc4&color=fff' }} 
          style={[
            styles.avatar, 
            { 
              width: avatarSize, 
              height: avatarSize, 
              borderRadius: 50,
              marginTop: avatarMarginTop,
              opacity: headerOpacity,
            }
          ]} 
        />
        
        <Animated.View style={[styles.profileNameSection, { opacity: headerOpacity }]}>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <TouchableOpacity style={styles.editButton} onPress={editProfile}>
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

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
              onPress={() => navigation.navigate('TournamentWinners', { user: userData })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E6F2FF' }]}>
                <Ionicons name="trophy" size={20} color="#4285F4" />
              </View>
              <Text style={styles.menuText}>Tournament Winners</Text>
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
            activeOpacity={0.6} 
            onPress={directLogout}
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
    zIndex: 0,
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
    zIndex: 2,
  },
  avatar: {
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
    ...SHADOWS.medium,
    marginTop: -50,
  },
  profileNameSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: SIZES.padding.lg,
    paddingBottom: 20,
  },
  userName: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.xs,
    marginLeft: 4,
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
  scrollContentContainer: {
    paddingTop: 150,
    zIndex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 90,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.padding.md,
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding.md,
    borderRadius: SIZES.radius.lg,
    ...SHADOWS.small,
    marginTop: SIZES.padding.lg,
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
    marginHorizontal: SIZES.padding.md,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.xs,
  },
  menuContainer: {
    backgroundColor: COLORS.background,
    marginTop: SIZES.padding.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.md,
    marginHorizontal: SIZES.padding.md,
    marginVertical: 6,
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
    marginHorizontal: SIZES.padding.md,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.sm,
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
    paddingBottom: SIZES.padding.md,
    marginTop: SIZES.padding.sm,
  },
  versionText: {
    ...FONTS.small,
    color: COLORS.text.light,
  }
}); 