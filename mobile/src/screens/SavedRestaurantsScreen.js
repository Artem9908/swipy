import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Platform,
  SafeAreaView,
  StyleSheet,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function SavedRestaurantsScreen({ navigation, route }) {
  const { user, startTournament } = route.params || {};
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null); // Track which restaurant is being removed
  const [refreshing, setRefreshing] = useState(false); // Add missing refreshing state
  
  // Refs for managing refresh and request cancellation
  const initialLoadCompleteRef = useRef(false);
  const cancelTokenRef = useRef(null);
  const inTournamentRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Focus effect to refresh data when screen comes into focus, but only after initial load
  useFocusEffect(
    useCallback(() => {
      console.log('SavedRestaurantsScreen focused');
      
      // Skip refresh if we're in tournament mode
      if (inTournamentRef.current) {
        console.log('Skipping refresh - in tournament mode');
        return;
      }
      
      // Wait a short time to ensure we're not caught in a navigation transition
      const timer = setTimeout(() => {
        // Only refresh if not in initial loading and not currently fetching
        if (initialLoadCompleteRef.current && !isFetchingRef.current) {
          console.log('Refreshing restaurants data');
          fetchSavedRestaurants(false); // Don't show loading indicator for refresh
        } else {
          console.log('Skipping refresh - initial load not complete or already fetching');
        }
      }, 300);
      
      return () => {
        // Cleanup function when screen loses focus
        clearTimeout(timer);
        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel('Screen lost focus');
          cancelTokenRef.current = null;
        }
      };
    }, [user])
  );

  // Initial load
  useEffect(() => {
    navigation.setOptions({ title: 'Favorite Restaurants' });
    fetchSavedRestaurants(true); // Show loading indicator for initial load
    
    return () => {
      // Cancel pending requests on unmount
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
        cancelTokenRef.current = null;
      }
    };
  }, []);
  
  // Check if we should automatically start a tournament
  useEffect(() => {
    if (startTournament && savedRestaurants.length >= 2) {
      // Wait a bit for the UI to render before navigating
      const timer = setTimeout(() => {
        navigation.navigate('Tournament', { user, savedRestaurants });
      }, 500);
      
      // Clean up timer
      return () => clearTimeout(timer);
    }
  }, [savedRestaurants, startTournament]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const fetchSavedRestaurants = async (showLoadingIndicator = true) => {
    if (!user || !user._id) {
      console.log('User information is missing:', user);
      setError('User information is missing');
      setLoading(false);
      initialLoadCompleteRef.current = true; // Mark as complete even on error
      return;
    }
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Already fetching saved restaurants, skipping');
      return;
    }
    
    // Cancel any existing requests
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation canceled due to new request');
    }
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    isFetchingRef.current = true;
    if (showLoadingIndicator) {
      setLoading(true);
    }
    
    try {
      // Use localhost for web or IP for devices
      const baseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001' 
        : 'http://192.168.0.82:5001';
        
      const apiUrl = `${baseUrl}/api/users/${user._id}/likes`;
        
      console.log('Fetching saved restaurants from:', apiUrl);
      
      const res = await axios.get(apiUrl, {
        cancelToken: cancelTokenRef.current.token
      });
      console.log('Response status:', res.status);
      
      if (!res.data) {
        console.error('No data received from server');
        setError('No data received from server');
        setLoading(false);
        initialLoadCompleteRef.current = true; // Mark as complete even on error
        return;
      }
      
      if (!Array.isArray(res.data)) {
        console.error('Invalid response format (not an array):', res.data);
        setError('Invalid response format from server');
        setLoading(false);
        initialLoadCompleteRef.current = true; // Mark as complete even on error
        return;
      }
      
      // Validate each restaurant has a valid ID
      const validatedRestaurants = res.data.filter(restaurant => {
        if (!restaurant.restaurantId) {
          console.error('Restaurant missing ID:', restaurant);
          return false;
        }
        return true;
      });
      
      // Sort by date (newest first)
      const sortedRestaurants = validatedRestaurants.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      console.log(`Successfully loaded ${sortedRestaurants.length} saved restaurants`);
      
      // Mark initial load as complete
      initialLoadCompleteRef.current = true;
      
      setSavedRestaurants(sortedRestaurants);
      
      // Update user object in route params to propagate favorites count back to profile
      if (route.params) {
        const updatedUser = {
          ...user,
          favorites: sortedRestaurants
        };
        
        // Update current route
        navigation.setParams({ user: updatedUser });
        
        // Try to update parent route as well
        const profileScreen = navigation.getParent();
        if (profileScreen && profileScreen.params) {
          profileScreen.setParams({ user: updatedUser });
        }
      }
      
      setLoading(false);
      setError(null);
      
      return sortedRestaurants;
    } catch (e) {
      if (!axios.isCancel(e)) {
        console.error('Error fetching saved restaurants:', e);
        setError('Failed to load saved restaurants');
        setLoading(false);
        initialLoadCompleteRef.current = true; // Mark as complete even on error
      } else {
        console.log('Fetch saved restaurants request was canceled:', e.message);
      }
      return [];
    } finally {
      isFetchingRef.current = false;
    }
  };

  const viewRestaurantDetails = (restaurant) => {
    if (!restaurant || !restaurant.restaurantId) {
      console.error('Cannot view details: restaurant data is incomplete');
      Alert.alert('Error', 'Restaurant data is incomplete');
      return;
    }
    
    console.log(`Viewing details for restaurant: ${restaurant.restaurantId} (${restaurant.restaurantName})`);
    
    // Создаем полный объект ресторана с гарантированно валидными полями
    const restaurantDetails = {
      _id: restaurant.restaurantId,
      place_id: restaurant.restaurantId,
      name: restaurant.restaurantName || 'Unknown Restaurant',
      image: restaurant.image || null,
      photos: restaurant.image ? [restaurant.image] : [],
      cuisine: restaurant.cuisine || '',
      priceRange: restaurant.priceRange || '',
      rating: restaurant.rating || 0,
      address: restaurant.location || '',
      location: restaurant.location || '',
      description: restaurant.description || ''
    };
    
    console.log('Navigating to RestaurantDetail with data:', JSON.stringify(restaurantDetails, null, 2));
    
    // Отдельно проверим пользователя
    const userData = user ? { ...user } : null;
    
    navigation.navigate('RestaurantDetail', { 
      restaurant: restaurantDetails, 
      user: userData 
    });
  };

  // New function to handle restaurant removal
  const handleRemoveRestaurant = (restaurantId, restaurantName) => {
    console.log(`Starting removal process for restaurant: ${restaurantId} (${restaurantName})`);
    
    Alert.alert(
      'Remove Restaurant',
      `Remove "${restaurantName}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeRestaurant(restaurantId, restaurantName)
        }
      ]
    );
  };

  // Separate function to handle the actual removal
  const removeRestaurant = async (restaurantId, restaurantName) => {
    if (!restaurantId) {
      console.error('Cannot remove: restaurantId is missing');
      return;
    }
    
    try {
      console.log(`Removing restaurant ${restaurantId} (${restaurantName}) from favorites`);
      setRemovingId(restaurantId); // Mark this restaurant as being removed
      
      // Construct API URL
      const baseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001' 
        : 'http://192.168.0.82:5001';
      
      const apiUrl = `${baseUrl}/api/users/${user._id}/likes/${restaurantId}`;
      console.log('DELETE request URL:', apiUrl);
      
      // Optimistic UI update - remove immediately
      setSavedRestaurants(prev => 
        prev.filter(r => r.restaurantId !== restaurantId)
      );
      
      // Update user object in route params for propagation
      if (route.params) {
        const updatedFavorites = savedRestaurants.filter(r => r.restaurantId !== restaurantId);
        navigation.setParams({
          user: {
            ...user,
            favorites: updatedFavorites
          }
        });
      }
      
      // Cancel any existing requests
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Operation canceled due to new request');
      }
      
      // Create a new cancel token
      cancelTokenRef.current = axios.CancelToken.source();
      
      // Use axios instead of XMLHttpRequest for consistency and cancellation support
      await axios.delete(apiUrl, {
        cancelToken: cancelTokenRef.current.token
      });
      
      console.log('DELETE success');
      
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error removing restaurant:', error);
        
        // Revert the optimistic update on failure
        fetchSavedRestaurants(false);
        
        // Show error to user
        Alert.alert(
          'Error',
          'Failed to remove restaurant. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('Delete request was canceled:', error.message);
      }
    } finally {
      setRemovingId(null); // Clear the removing state
    }
  };

  const renderRestaurantItem = ({ item }) => {
    const isRemoving = item.restaurantId === removingId;
    
    return (
      <TouchableOpacity 
        style={[
          styles.restaurantCard,
          isRemoving && { opacity: 0.5 } // Visual feedback while removing
        ]}
        onPress={() => viewRestaurantDetails(item)}
        disabled={isRemoving}
      >
        <View style={styles.cardContent}>
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/100?text=No+Image' }} 
            style={styles.restaurantImage} 
          />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurantName}</Text>
            
            <View style={styles.detailsRow}>
              {item.cuisine && (
                <Text style={styles.cuisine}>{item.cuisine}</Text>
              )}
              {item.priceRange && (
                <Text style={styles.price}>{item.priceRange}</Text>
              )}
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.rating}>{item.rating}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
              <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
            </View>
            
            <Text style={styles.savedDate}>Saved on {formatDate(item.timestamp)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.removeButton,
            isRemoving && styles.removingButton
          ]}
          onPress={() => {
            // Direct removal function without confirmation dialog for better user experience
            removeRestaurant(item.restaurantId, item.restaurantName);
          }}
          disabled={isRemoving}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Larger touch area
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Ionicons name="heart-dislike" size={24} color={COLORS.error} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // New explicit function to start tournament
  const handleStartTournament = () => {
    // Prevent navigation if no saved restaurants
    if (!savedRestaurants || savedRestaurants.length < 2) {
      Alert.alert(
        'Not Enough Restaurants',
        'You need at least 2 saved restaurants to start a tournament',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('Starting tournament with', savedRestaurants.length, 'restaurants');

    // Flag that we're entering tournament mode to prevent refresh loops
    inTournamentRef.current = true;
    
    // Cancel any pending requests to avoid conflicts
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Navigation to tournament');
      cancelTokenRef.current = null;
    }

    // Navigate with a delay to ensure clean state
    setTimeout(() => {
      // Deep clone savedRestaurants to avoid any reference issues
      const restaurantsCopy = savedRestaurants.map(r => ({...r}));
      
      navigation.navigate('Tournament', {
        savedRestaurants: restaurantsCopy,
        user,
        timestamp: Date.now(), // Ensure React treats this as a new route
      });
      
      // Reset the tournament flag after navigation is complete
      setTimeout(() => {
        inTournamentRef.current = false;
      }, 500);
    }, 100);
  };

  // Define the onRefresh function for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedRestaurants(false).finally(() => {
      setRefreshing(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading saved restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSavedRestaurants(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Different UI display for no restaurants
  if (savedRestaurants.length === 0 && !loading && !error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={COLORS.inactive} />
          <Text style={styles.emptyTitle}>No Saved Restaurants</Text>
          <Text style={styles.emptyText}>
            You haven't saved any restaurants yet. Swipe through restaurants and save 
            your favorites to see them here.
          </Text>
          
          <TouchableOpacity 
            style={styles.discoverButton} 
            onPress={() => navigation.navigate('Discover', { user })}
          >
            <Text style={styles.discoverButtonText}>Discover Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={savedRestaurants}
        keyExtractor={item => item.restaurantId}
        renderItem={renderRestaurantItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color={COLORS.text.secondary} />
            <Text style={styles.emptyTitle}>No saved restaurants yet</Text>
            <Text style={styles.emptyText}>
              Swipe right on restaurants you like to save them here
            </Text>
            <TouchableOpacity 
              style={styles.discoverButton} 
              onPress={() => navigation.navigate('Discover', { user })}
            >
              <Text style={styles.discoverButtonText}>Discover Restaurants</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={() => (
          savedRestaurants.length >= 2 ? (
            <TouchableOpacity 
              style={styles.chooseTournamentButton} 
              onPress={handleStartTournament}
            >
              <Ionicons name="trophy-outline" size={20} color={COLORS.text.inverse} />
              <Text style={styles.chooseTournamentText}>Choose One Restaurant</Text>
            </TouchableOpacity>
          ) : null
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
      
      {/* Info card about restaurant history */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Restaurant History</Text>
          <Text style={styles.infoText}>
            We remember restaurants you've already swiped so you'll only see new options. 
            Restaurants in your favorites also won't appear in Discover.
            Need to start over? Go to your Profile and use "Reset Swiped Restaurants".
          </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...FONTS.h3,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SIZES.padding.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  retryButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    ...FONTS.h2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.lg,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SIZES.padding.md,
    marginBottom: SIZES.padding.xl,
  },
  discoverButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.xl,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  discoverButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
  },
  listContainer: {
    padding: SIZES.padding.md,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.padding.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: SIZES.padding.md,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius.sm,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: SIZES.padding.md,
  },
  restaurantName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  cuisine: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.sm,
  },
  price: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  savedDate: {
    ...FONTS.caption,
    color: COLORS.text.light,
    fontStyle: 'italic',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.md,
    backgroundColor: COLORS.background,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    width: 60,
    minHeight: 80,
  },
  removingButton: {
    backgroundColor: COLORS.background + '80',
  },
  chooseTournamentButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.xl,
    marginHorizontal: SIZES.padding.md,
    ...SHADOWS.medium,
  },
  chooseTournamentText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
    marginLeft: SIZES.padding.sm,
  },
  infoCard: {
    marginHorizontal: SIZES.padding.lg,
    marginBottom: SIZES.padding.lg,
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  infoIconContainer: {
    marginRight: SIZES.padding.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.xs,
  },
  infoText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    fontSize: 13,
  },
  refreshing: {
    backgroundColor: 'transparent',
  },
});