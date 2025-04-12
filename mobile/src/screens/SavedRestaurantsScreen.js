import React, { useState, useEffect } from 'react';
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
  StyleSheet
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function SavedRestaurantsScreen({ navigation, route }) {
  const { user, startTournament } = route.params || {};
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null); // Track which restaurant is being removed

  useEffect(() => {
    fetchSavedRestaurants();
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

  const fetchSavedRestaurants = async () => {
    if (!user || !user._id) {
      console.log('User information is missing:', user);
      setError('User information is missing');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Use localhost for web or IP for devices
      const baseUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001' 
        : 'http://192.168.0.82:5001';
        
      const apiUrl = `${baseUrl}/api/users/${user._id}/likes`;
        
      console.log('Fetching saved restaurants from:', apiUrl);
      
      const res = await axios.get(apiUrl);
      console.log('Response status:', res.status);
      
      if (!res.data) {
        console.error('No data received from server');
        setError('No data received from server');
        setLoading(false);
        return;
      }
      
      if (!Array.isArray(res.data)) {
        console.error('Invalid response format (not an array):', res.data);
        setError('Invalid response format from server');
        setLoading(false);
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
      
      setSavedRestaurants(sortedRestaurants);
      setLoading(false);
      setError(null);
    } catch (e) {
      console.error('Error fetching saved restaurants:', e);
      setError('Failed to load saved restaurants');
      setLoading(false);
    }
  };

  const viewRestaurantDetails = (restaurant) => {
    // Convert saved restaurant format to the format expected by RestaurantDetailScreen
    const restaurantDetails = {
      _id: restaurant.restaurantId,
      place_id: restaurant.restaurantId,
      name: restaurant.restaurantName,
      image: restaurant.image,
      cuisine: restaurant.cuisine,
      priceRange: restaurant.priceRange,
      rating: restaurant.rating,
      address: restaurant.location
    };
    
    navigation.navigate('RestaurantDetail', { restaurant: restaurantDetails, user });
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
      
      // Use XMLHttpRequest instead of axios
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('DELETE', apiUrl, true);
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('DELETE success, response:', xhr.responseText);
            resolve(xhr.responseText);
          } else {
            console.error('DELETE failed, status:', xhr.status, 'response:', xhr.responseText);
            reject(new Error(`DELETE failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = function() {
          console.error('Network error during DELETE request');
          reject(new Error('Network error'));
        };
        
        xhr.send();
      });
      
    } catch (error) {
      console.error('Error removing restaurant:', error);
      
      // Revert the optimistic update on failure
      fetchSavedRestaurants();
      
      // Show error to user
      Alert.alert(
        'Error',
        'Failed to remove restaurant. Please try again.',
        [{ text: 'OK' }]
      );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved restaurants...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSavedRestaurants}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (savedRestaurants.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={savedRestaurants}
        renderItem={renderRestaurantItem}
        keyExtractor={item => item.restaurantId}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={() => (
          savedRestaurants.length >= 2 ? (
            <TouchableOpacity 
              style={styles.chooseTournamentButton} 
              onPress={() => navigation.navigate('Tournament', { user, savedRestaurants })}
            >
              <Ionicons name="trophy-outline" size={20} color={COLORS.text.inverse} />
              <Text style={styles.chooseTournamentText}>Choose One Restaurant</Text>
            </TouchableOpacity>
          ) : null
        )}
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});