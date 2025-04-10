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

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
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
      
      // Use localhost for web or IP for devices
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/restaurants?${params.toString()}` 
        : `http://192.168.0.82:5001/api/restaurants?${params.toString()}`;
        
      console.log('Fetching restaurants from:', apiUrl);
      const res = await axios.get(apiUrl);
      
      if (res.data && Array.isArray(res.data)) {
        console.log(`Received ${res.data.length} restaurants`);
        
        // Process restaurant data to ensure consistent format
        const processedRestaurants = res.data.map(restaurant => {
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
        
        setRestaurants(processedRestaurants);
        setCurrentIndex(0);
        position.setValue({ x: 0, y: 0 });
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
      
        // If user is logged in, save the like
        if (user && user._id) {
          const apiUrl = Platform.OS === 'web' 
            ? `http://localhost:5001/api/users/${user._id}/likes` 
            : `http://192.168.0.82:5001/api/users/${user._id}/likes`;
            
          // Ensure we're sending all required data for the saved restaurant
          axios.post(apiUrl, { 
            restaurantId: restaurant.place_id || restaurant._id,
            restaurantName: restaurant.name,
            image: restaurant.image || (restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos[0] : null),
            cuisine: restaurant.cuisine,
            priceRange: restaurant.priceRange,
            rating: restaurant.rating,
            location: restaurant.address || restaurant.location
          })
          .catch(e => console.error('Error saving like:', e));
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
        <View style={styles.noMoreContainer}>
          <Ionicons name="restaurant-outline" size={80} color={COLORS.text.secondary} />
          <Text style={styles.noMoreText}>No more restaurants</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchRestaurants}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
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
  noMoreText: {
    ...FONTS.h2,
    color: COLORS.text.secondary,
    marginVertical: SIZES.padding.lg,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  refreshButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
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