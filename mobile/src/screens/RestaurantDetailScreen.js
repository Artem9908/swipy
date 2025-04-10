import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant: initialRestaurant, user } = route.params;
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  useEffect(() => {
    console.log("Initial restaurant data:", JSON.stringify(initialRestaurant, null, 2));
    fetchRestaurantDetails();
  }, []);
  
  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      
      const restaurantId = initialRestaurant.place_id || initialRestaurant._id;
      
      if (!restaurantId) {
        console.log('No restaurant ID found, using initial data');
        setRestaurant(initialRestaurant);
        setLoading(false);
        return;
      }
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/restaurants/${restaurantId}` 
        : `http://192.168.0.82:5001/api/restaurants/${restaurantId}`;
      
      console.log('Fetching restaurant details from:', apiUrl);
      const response = await axios.get(apiUrl);
      
      if (response.data) {
        console.log('Restaurant details received:', response.data);
        setRestaurant(response.data);
        
        if (response.data.reviews) {
          setReviews(response.data.reviews);
        }
      }
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details');
      // Fall back to initial data
      setRestaurant(initialRestaurant);
    } finally {
      setLoading(false);
    }
  };
  
  const getPhotoUrl = () => {
    if (restaurant.photos && restaurant.photos.length > 0) {
      return { uri: restaurant.photos[currentPhotoIndex] };
    } else if (restaurant.image) {
      return { uri: restaurant.image };
    }
    return { uri: 'https://via.placeholder.com/400x300?text=No+Image' };
  };
  
  const nextPhoto = () => {
    if (restaurant.photos && restaurant.photos.length > 1) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === restaurant.photos.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const prevPhoto = () => {
    if (restaurant.photos && restaurant.photos.length > 1) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === 0 ? restaurant.photos.length - 1 : prevIndex - 1
      );
    }
  };
  
  const callRestaurant = () => {
    if (!restaurant.phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    Linking.openURL(`tel:${restaurant.phone}`).catch(err => {
      console.error('Error making call:', err);
      Alert.alert('Error', 'Could not make call');
    });
  };
  
  const getDirections = () => {
    const address = restaurant.address || restaurant.location;
    if (!address) {
      Alert.alert('Error', 'Address not available');
      return;
    }
    
    const query = typeof address === 'string' 
      ? address 
      : `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`
    });
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps');
    });
  };
  
  const visitWebsite = () => {
    if (!restaurant.website) {
      Alert.alert('Error', 'Website not available');
      return;
    }
    
    Linking.openURL(restaurant.website).catch(err => {
      console.error('Error opening website:', err);
      Alert.alert('Error', 'Could not open website');
    });
  };
  
  const makeReservation = () => {
    navigation.navigate('Reservation', { restaurant, user });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurantDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Restaurant Image */}
      <View style={styles.imageContainer}>
        {restaurant.photos && restaurant.photos.length > 0 || restaurant.image ? (
          <>
            <Image source={getPhotoUrl()} style={styles.image} resizeMode="cover" />
            
            {restaurant.photos && restaurant.photos.length > 1 && (
              <>
                <TouchableOpacity style={styles.prevButton} onPress={prevPhoto}>
                  <Ionicons name="chevron-back" size={30} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.nextButton} onPress={nextPhoto}>
                  <Ionicons name="chevron-forward" size={30} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {currentPhotoIndex + 1}/{restaurant.photos.length}
                  </Text>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={60} color={COLORS.text.secondary} />
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restaurant.name}</Text>
        
        <View style={styles.detailsRow}>
          {restaurant.cuisine && (
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{restaurant.cuisine}</Text>
            </View>
          )}
          
          {restaurant.priceRange && (
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{restaurant.priceRange}</Text>
            </View>
          )}
          
          {restaurant.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color={COLORS.warning} />
              <Text style={styles.rating}>{restaurant.rating}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
          <Text style={styles.address}>
            {typeof restaurant.address === 'string' 
              ? restaurant.address 
              : restaurant.address 
                ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}, ${restaurant.address.state || ''} ${restaurant.address.zipCode || ''}` 
                : restaurant.location || 'Address not available'}
          </Text>
        </View>
        
        {restaurant.hours && (
          <View style={styles.hoursContainer}>
            <Ionicons name="time-outline" size={20} color={COLORS.text.secondary} />
            <Text style={styles.hours}>
              {typeof restaurant.hours === 'string' 
                ? restaurant.hours 
                : Array.isArray(restaurant.hours) 
                  ? restaurant.hours.join('\n')
                  : 'Hours not available'}
            </Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={makeReservation}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Reserve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={getDirections}>
            <Ionicons name="navigate-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={callRestaurant}>
            <Ionicons name="call-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={visitWebsite}>
            <Ionicons name="globe-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
        </View>
        
        {/* Description */}
        {restaurant.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{restaurant.description}</Text>
          </View>
        )}
        
        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((review, index) => (
              <View key={index} style={styles.reviewContainer}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author || 'Anonymous'}</Text>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={16} color={COLORS.warning} />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
    ...FONTS.body,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginVertical: SIZES.padding.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  retryButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
  },
  imageContainer: {
    height: height * 0.35,
    width: width,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  noImageText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.sm,
  },
  photoCounter: {
    position: 'absolute',
    bottom: SIZES.padding.md,
    right: SIZES.padding.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs / 2,
    borderRadius: SIZES.radius.sm,
  },
  photoCounterText: {
    ...FONTS.caption,
    color: '#fff',
  },
  prevButton: {
    position: 'absolute',
    left: SIZES.padding.sm,
    top: '50%',
    transform: [{ translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
  nextButton: {
    position: 'absolute',
    right: SIZES.padding.sm,
    top: '50%',
    transform: [{ translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
  backButton: {
    position: 'absolute',
    top: SIZES.padding.md,
    left: SIZES.padding.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  infoContainer: {
    padding: SIZES.padding.lg,
  },
  name: {
    ...FONTS.h1,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
    flexWrap: 'wrap',
  },
  tagContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.sm,
    marginRight: SIZES.padding.sm,
    marginBottom: SIZES.padding.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
  },
  rating: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding.md,
  },
  address: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.sm,
    flex: 1,
  },
  hoursContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding.lg,
  },
  hours: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.sm,
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.lg,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.xs,
  },
  section: {
    marginBottom: SIZES.padding.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
  },
  description: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  reviewContainer: {
    marginBottom: SIZES.padding.md,
    padding: SIZES.padding.md,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.xs,
  },
  reviewAuthor: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    ...FONTS.caption,
    color: COLORS.text.primary,
    marginLeft: 4,
  },
  reviewText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  }
}); 