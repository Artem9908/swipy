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
  const { user } = route.params || {};
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedRestaurants();
  }, []);

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
      // Use localhost for web or IP for devices
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/likes` 
        : `http://192.168.0.82:5001/api/users/${user._id}/likes`;
        
      console.log('Fetching saved restaurants from:', apiUrl);
      console.log('User ID:', user._id);
      
      const res = await axios.get(apiUrl);
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      console.log('Received saved restaurants data:', JSON.stringify(res.data, null, 2));
      
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
      
      // Sort by date (newest first)
      const sortedRestaurants = res.data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setSavedRestaurants(sortedRestaurants);
      setLoading(false);
      setError(null);
    } catch (e) {
      console.error('Error fetching saved restaurants:', e);
      if (e.response) {
        console.error('Error response status:', e.response.status);
        console.error('Error response data:', e.response.data);
      } else if (e.request) {
        console.error('No response received:', e.request);
      } else {
        console.error('Error message:', e.message);
      }
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

  const confirmRemove = (restaurantId, restaurantName) => {
    Alert.alert(
      'Remove Restaurant',
      `Are you sure you want to remove "${restaurantName}" from your favorites?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          onPress: () => removeFromSaved(restaurantId),
          style: 'destructive'
        }
      ]
    );
  };

  const removeFromSaved = async (restaurantId) => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/likes/${restaurantId}` 
        : `http://192.168.0.82:5001/api/users/${user._id}/likes/${restaurantId}`;
        
      await axios.delete(apiUrl);
      setSavedRestaurants(savedRestaurants.filter(restaurant => restaurant.restaurantId !== restaurantId));
    } catch (e) {
      console.error('Error removing from saved:', e);
      Alert.alert('Error', 'Failed to remove from saved');
    }
  };

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.restaurantCard}
      onPress={() => viewRestaurantDetails(item)}
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
        style={styles.removeButton}
        onPress={() => confirmRemove(item.restaurantId, item.restaurantName)}
      >
        <Ionicons name="heart-dislike" size={24} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <Text style={styles.emptyText}>No saved restaurants</Text>
        <Text style={styles.emptySubtext}>
          Swipe right on restaurants you like to save them here
        </Text>
        <TouchableOpacity 
          style={styles.discoverButton} 
          onPress={() => navigation.navigate('Main', { screen: 'Discover' })}
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
      />
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
  emptyText: {
    ...FONTS.h2,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.lg,
  },
  emptySubtext: {
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
  },
});