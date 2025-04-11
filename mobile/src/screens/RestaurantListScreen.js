import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ActivityIndicator, 
  Platform, 
  Dimensions, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  PanResponder
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import RestaurantCard from '../components/RestaurantCard';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

export default function RestaurantListScreen({ navigation, route }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user, filters } = route.params || { user: null, filters: null };
  
  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const isSwipingRef = useRef(false);
  
  // Calculate rotation based on horizontal movement
  const rotation = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });
  
  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const dislikeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  // Pan responder for swipe gestures - Tinder-like implementation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSwipingRef.current,
      onMoveShouldSetPanResponder: () => !isSwipingRef.current,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipeLeft();
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  useEffect(() => {
    fetchRestaurants();
  }, [filters]);
  
  // Refresh restaurants when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, refreshing restaurants data...');
      // Only fetch if already logged in (the initial effect will handle the first load)
      if (user && user._id) {
        fetchRestaurants();
      }
      return () => {
        // Cleanup when screen loses focus
      };
    }, [user])
  );

  const checkAlreadySwiped = async (restaurantId) => {
    if (!user || !user._id || !restaurantId) return false;
    
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/swiped/${restaurantId}` 
        : `http://192.168.0.82:5001/api/users/${user._id}/swiped/${restaurantId}`;
        
      const response = await axios.get(apiUrl);
      return response.data.isSwiped || false;
    } catch (error) {
      console.error('Error checking if restaurant was swiped:', error);
      return false;
    }
  };
  
  // Filter out restaurants that the user has already swiped
  const filterSwipedRestaurants = async (restaurantsList) => {
    if (!user || !user._id) return restaurantsList;
    
    try {
      const filteredRestaurants = [];
      
      for (const restaurant of restaurantsList) {
        const restaurantId = restaurant.place_id || restaurant._id;
        const isAlreadySwiped = await checkAlreadySwiped(restaurantId);
        
        if (!isAlreadySwiped) {
          filteredRestaurants.push(restaurant);
        }
      }
      
      return filteredRestaurants;
    } catch (error) {
      console.error('Error filtering swiped restaurants:', error);
      return restaurantsList;
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
      // Fetch liked restaurants first to ensure we can filter properly
      let likedRestaurantIds = [];
      if (user && user._id) {
        try {
          const likesUrl = Platform.OS === 'web'
            ? `http://localhost:5001/api/users/${user._id}/likes`
            : `http://192.168.0.82:5001/api/users/${user._id}/likes`;
            
          const likesResponse = await axios.get(likesUrl);
          if (likesResponse.data && Array.isArray(likesResponse.data)) {
            likedRestaurantIds = likesResponse.data.map(like => like.restaurantId);
            console.log(`User has ${likedRestaurantIds.length} liked restaurants to exclude`);
          }
        } catch (error) {
          console.error('Error fetching liked restaurants:', error);
        }
      }
      
      // Get location from filters or use default
      const location = filters?.location || 'New York';
      const cuisine = filters?.cuisine;
      const price = filters?.price;
      const rating = filters?.rating;
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('location', location);
      if (cuisine) params.append('cuisine', cuisine);
      if (price) params.append('price', price);
      if (rating) params.append('rating', rating);
      
      // Add userId to filter out swiped restaurants
      if (user && user._id) {
        console.log('Passing user ID for filtering:', user._id);
        params.append('userId', user._id);
      } else {
        console.warn('Cannot filter for favorites - no user ID available');
      }
      
      // Use localhost for web or IP for devices
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/restaurants?${params.toString()}` 
        : `http://192.168.0.82:5001/api/restaurants?${params.toString()}`;
        
      console.log('Fetching restaurants from:', apiUrl);
      const res = await axios.get(apiUrl);
      
      if (res.data && Array.isArray(res.data)) {
        console.log(`Received ${res.data.length} restaurants from server`);
        
        // Process restaurant data to ensure consistent format
        let processedRestaurants = res.data.map(restaurant => {
          return {
            ...restaurant,
            // Ensure we have a place_id or _id
            _id: restaurant._id || restaurant.place_id,
            place_id: restaurant.place_id || restaurant._id,
            // Ensure we have a proper address
            address: restaurant.address || restaurant.location,
            // Ensure we have a proper image
            image: restaurant.image || (restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos[0] : null)
          };
        });
        
        // Additional client-side filtering to ensure liked restaurants are excluded
        if (likedRestaurantIds.length > 0) {
          const initialCount = processedRestaurants.length;
          processedRestaurants = processedRestaurants.filter(restaurant => {
            const restId = restaurant._id || restaurant.place_id;
            const isInFavorites = likedRestaurantIds.includes(restId);
            if (isInFavorites) {
              console.log(`CLIENT FILTER: Excluding restaurant ${restaurant.name} (${restId}) because it's in favorites`);
            }
            return !isInFavorites;
          });
          console.log(`CLIENT FILTER: Removed ${initialCount - processedRestaurants.length} restaurants that were in favorites`);
        }
        
        setRestaurants(processedRestaurants);
        setCurrentIndex(0);
        position.setValue({ x: 0, y: 0 });
        
        if (processedRestaurants.length === 0) {
          Alert.alert(
            'No Restaurants Found',
            'We couldn\'t find any new restaurants with your current filters. Try adjusting your filters or clear your swipe history to see more restaurants.',
            [
              { text: 'OK' }
            ]
          );
        }
      } else {
        console.log('No restaurants found');
        setRestaurants([]);
      }
    } catch (e) {
      console.error('Error fetching restaurants:', e);
      Alert.alert('Error', 'Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to record restaurant as swiped (for both like and dislike)
  const recordSwipedRestaurant = async (restaurantId, restaurantName, direction) => {
    if (!user || !user._id) return;
    
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/swiped` 
        : `http://192.168.0.82:5001/api/users/${user._id}/swiped`;
        
      await axios.post(apiUrl, {
        restaurantId,
        restaurantName,
        direction
      });
      
      console.log(`Recorded ${direction} swipe for restaurant: ${restaurantName}`);
    } catch (error) {
      console.error('Error recording swiped restaurant:', error);
    }
  };
  
  // Function to clear swipe history
  const clearSwipeHistory = async () => {
    if (!user || !user._id) return;
    
    try {
      setLoading(true);
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/swiped` 
        : `http://192.168.0.82:5001/api/users/${user._id}/swiped`;
        
      const response = await axios.delete(apiUrl);
      console.log('Cleared swipe history:', response.data);
      
      // Fetch restaurants again
      await fetchRestaurants();
    } catch (error) {
      console.error('Error clearing swipe history:', error);
      Alert.alert('Error', 'Failed to clear swipe history. Please try again.');
      setLoading(false);
    }
  };

  // Function to handle swipe right (like)
  const forceSwipeRight = () => {
    isSwipingRef.current = true;
    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      const restaurant = restaurants[currentIndex];
      
      // Handle like
      if (restaurant) {
        console.log('Liked restaurant:', restaurant.name);
        
        // Make sure we have a valid ID for the restaurant
        const restaurantId = restaurant.place_id || restaurant._id;
        console.log(`Restaurant ID for like: ${restaurantId}`);
        
        // Record the swipe in history
        recordSwipedRestaurant(
          restaurantId,
          restaurant.name,
          'right'
        );
      
        // If user is logged in, save the like
        if (user && user._id) {
          const apiUrl = Platform.OS === 'web' 
            ? `http://localhost:5001/api/users/${user._id}/likes` 
            : `http://192.168.0.82:5001/api/users/${user._id}/likes`;
            
          console.log(`Saving like for user ${user._id}, restaurant ${restaurant.name} (${restaurantId})`);
            
          // Ensure we're sending all required data for the saved restaurant
          axios.post(apiUrl, { 
            restaurantId: restaurantId,
            restaurantName: restaurant.name,
            image: restaurant.image || (restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos[0] : null),
            cuisine: restaurant.cuisine,
            priceRange: restaurant.priceRange,
            rating: restaurant.rating,
            location: restaurant.address || restaurant.location
          })
          .then(response => {
            console.log('Restaurant successfully saved to favorites:', response.data);
          })
          .catch(e => {
            console.error('Error saving like:', e);
            if (e.response) {
              console.error('Error response:', e.response.data);
            }
          });
          
          // Update user's lastSwipedAt status
          updateUserSwipeStatus(user._id);
        }
      }
      
      // Move to next card immediately
      setCurrentIndex(prevIndex => prevIndex + 1);
      position.setValue({ x: 0, y: 0 });
      isSwipingRef.current = false;
    });
  };

  // Function to handle swipe left (dislike)
  const forceSwipeLeft = () => {
    isSwipingRef.current = true;
    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      const restaurant = restaurants[currentIndex];
      if (restaurant) {
        console.log('Disliked restaurant:', restaurant.name);
        
        // Record the swipe in history
        recordSwipedRestaurant(
          restaurant.place_id || restaurant._id,
          restaurant.name,
          'left'
        );
        
        // Update user's lastSwipedAt status
        if (user && user._id) {
          updateUserSwipeStatus(user._id);
        }
      }
      
      // Move to next card immediately
      setCurrentIndex(prevIndex => prevIndex + 1);
      position.setValue({ x: 0, y: 0 });
      isSwipingRef.current = false;
    });
  };

  // Function to reset card position
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  // Button handlers
  const handleLike = () => {
    if (!isSwipingRef.current) {
      forceSwipeRight();
    }
  };

  const handleDislike = () => {
    if (!isSwipingRef.current) {
      forceSwipeLeft();
    }
  };

  const openFilters = () => {
    navigation.navigate('Filters', { 
      user,
      currentFilters: filters,
      onApplyFilters: (newFilters) => {
        navigation.navigate('Main', { 
          screen: 'Discover',
          params: { user, filters: newFilters }
        });
      }
    });
  };

  const viewRestaurantDetails = (restaurant) => {
    console.log('Viewing restaurant details:', restaurant.name);
    console.log('Restaurant ID:', restaurant.place_id || restaurant._id);
    navigation.navigate('RestaurantDetail', { restaurant, user });
  };

  // Function to update user's swipe status
  const updateUserSwipeStatus = (userId) => {
    const statusApiUrl = Platform.OS === 'web' 
      ? `http://localhost:5001/api/users/${userId}/status` 
      : `http://192.168.0.82:5001/api/users/${userId}/status`;
      
    axios.put(statusApiUrl, { 
      isOnline: true,
      lastSwipedAt: new Date().toISOString()
    })
    .catch(e => console.error('Error updating swipe status:', e));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding restaurants for you...</Text>
      </SafeAreaView>
    );
  }

  // Current restaurant to display
  const currentRestaurant = restaurants[currentIndex];
  
  // Check if we've run out of restaurants
  if (!currentRestaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity style={styles.filterButton} onPress={openFilters}>
            <Ionicons name="options-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.noMoreContainer}>
          <Ionicons name="restaurant-outline" size={80} color={COLORS.text.secondary} />
          <Text style={styles.noMoreTitle}>No more restaurants</Text>
          <Text style={styles.noMoreDescription}>
            You've seen all available restaurants that match your filters.
            We don't show restaurants you've already swiped on or saved to favorites.
            Try adjusting your filters or clearing your history.
          </Text>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchRestaurants}
            >
              <Ionicons name="refresh-outline" size={20} color={COLORS.text.inverse} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.startOverButton}
              onPress={clearSwipeHistory}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.text.inverse} />
              <Text style={styles.startOverButtonText}>Start Over</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.filterButtonLarge} 
            onPress={openFilters}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            <Text style={styles.filterButtonText}>Adjust Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButtonLarge, { marginTop: SIZES.padding.md }]} 
            onPress={() => navigation.navigate('SavedRestaurants', { user })}
          >
            <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
            <Text style={styles.filterButtonText}>Manage Favorites</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Moved to top with higher zIndex */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.filterButton} onPress={openFilters}>
          <Ionicons name="options-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Restaurant Card */}
      <View style={styles.cardContainer}>
        <RestaurantCard
          restaurant={currentRestaurant}
          onPress={viewRestaurantDetails}
          panHandlers={panResponder.panHandlers}
          likeOpacity={likeOpacity}
          dislikeOpacity={dislikeOpacity}
          rotation={rotation}
          style={{
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotation }
            ]
          }}
        />
        
        <View style={styles.swipeButtonsContainer}>
          <TouchableOpacity 
            style={[styles.swipeButton, styles.dislikeButton]} 
            onPress={handleDislike}
          >
            <Ionicons name="close-circle" size={60} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.swipeButton, styles.likeButton]} 
            onPress={handleLike}
          >
            <Ionicons name="heart-circle" size={60} color={COLORS.success} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.md,
    zIndex: 10, // Ensure header is above card
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  filterButton: {
    padding: SIZES.padding.sm,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding.lg,
    marginTop: -20, // Pull card up slightly
  },
  noMoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  noMoreTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginVertical: SIZES.padding.md,
  },
  noMoreDescription: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
    paddingHorizontal: SIZES.padding.xl,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding.lg,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
    marginHorizontal: SIZES.padding.sm,
  },
  refreshButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    marginLeft: SIZES.padding.xs,
  },
  startOverButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
    marginHorizontal: SIZES.padding.sm,
  },
  startOverButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    marginLeft: SIZES.padding.xs,
  },
  filterButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  filterButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    marginLeft: SIZES.padding.xs,
  },
  swipeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: SIZES.padding.xl,
    position: 'absolute',
    bottom: 0,
    zIndex: 5,
  },
  swipeButton: {
    padding: SIZES.padding.sm,
  },
  dislikeButton: {
    marginRight: SIZES.padding.xl,
  },
  likeButton: {
    marginLeft: SIZES.padding.xl,
  }
});