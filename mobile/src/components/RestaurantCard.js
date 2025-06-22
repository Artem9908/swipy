import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function RestaurantCard({ 
  restaurant, 
  onPress, 
  style, 
  panHandlers, 
  likeOpacity, 
  dislikeOpacity, 
  rotation 
}) {
  if (!restaurant) return null;
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setCurrentPhotoIndex(0);
    setImageLoading(true);
  }, [restaurant]);
  
  const allPhotos = [...new Set([restaurant.image, ...(restaurant.photos || [])].filter(Boolean))];

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % allPhotos.length);
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + allPhotos.length) % allPhotos.length);
  };
  
  // Get the first image or use a placeholder
  const imageSource = allPhotos.length > 0
    ? { uri: allPhotos[currentPhotoIndex] }
    : { uri: 'https://via.placeholder.com/400x300?text=No+Image' };
  
  // Format address
  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    if (typeof address === 'string') return address;
    
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`;
  };
  
  // Format hours for display
  const formatHours = (hours) => {
    if (!hours || !hours.length) return null;
    
    const today = new Date().getDay();
    // Sunday in JavaScript is 0, but in data might be 6
    const todayIndex = today === 0 ? 6 : today - 1;
    
    if (hours[todayIndex]) {
      if (typeof hours[todayIndex] === 'string' && hours[todayIndex].includes(':')) {
        return `Today: ${hours[todayIndex].split(': ')[1]}`;
      } else if (hours[todayIndex].day && hours[todayIndex].open) {
        return `Today: ${hours[todayIndex].open} - ${hours[todayIndex].close}`;
      }
    }
    
    return null;
  };
  
  return (
    <Animated.View 
      style={[
        styles.card,
        style
      ]}
      {...panHandlers}
    >
      {/* Like Overlay */}
      <Animated.View 
        style={[
          styles.overlayContainer, 
          styles.likeOverlay,
          { opacity: likeOpacity }
        ]}
      >
        <Text style={[styles.overlayText, { color: COLORS.success }]}>LIKE</Text>
      </Animated.View>
      
      {/* Dislike Overlay */}
      <Animated.View 
        style={[
          styles.overlayContainer, 
          styles.dislikeOverlay,
          { opacity: dislikeOpacity }
        ]}
      >
        <Text style={[styles.overlayText, { color: COLORS.error }]}>NOPE</Text>
      </Animated.View>
      
      <TouchableOpacity 
        style={styles.cardInner}
        onPress={() => onPress && onPress(restaurant)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
          <Image 
            source={imageSource} 
            style={styles.image} 
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {allPhotos.length > 1 && (
            <>
              <View style={styles.tapContainer}>
                <TouchableOpacity style={styles.tapArea} onPress={handlePrevPhoto} />
                <TouchableOpacity style={styles.tapArea} onPress={handleNextPhoto} />
              </View>
              <View style={styles.paginationContainer}>
                {allPhotos.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentPhotoIndex ? styles.paginationDotActive : null
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {restaurant.name}
          </Text>
          
          <View style={styles.detailsRow}>
            {restaurant.cuisine && (
              <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
            )}
            {restaurant.priceRange && (
              <Text style={styles.price}>{restaurant.priceRange}</Text>
            )}
            {restaurant.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={COLORS.warning} />
                <Text style={styles.rating}>{restaurant.rating}</Text>
                {restaurant.reviewCount && (
                  <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
                )}
              </View>
            )}
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.address} numberOfLines={2}>
              {restaurant.address ? formatAddress(restaurant.address) : restaurant.location || 'Address not available'}
            </Text>
          </View>
          
          {formatHours(restaurant.hours) && (
            <View style={styles.hoursRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
              <Text style={styles.hours}>{formatHours(restaurant.hours)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '98%',
    height: '75%',
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  cardInner: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: '100%',
    height: '85%',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  tapArea: {
    flex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    margin: 3,
  },
  paginationDotActive: {
    backgroundColor: 'white',
  },
  overlayContainer: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    borderWidth: 4,
    borderRadius: SIZES.radius.md,
    transform: [{ rotate: '-15deg' }],
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...SHADOWS.medium,
  },
  likeOverlay: {
    left: 20,
    borderColor: COLORS.success,
  },
  dislikeOverlay: {
    right: 20,
    borderColor: COLORS.error,
  },
  overlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  infoContainer: {
    padding: SIZES.padding.md,
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.xs,
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.xs,
    flexWrap: 'wrap',
  },
  cuisine: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.md,
  },
  price: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginLeft: 4,
    marginRight: 2,
  },
  reviewCount: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.padding.xs,
    paddingHorizontal: SIZES.padding.lg,
  },
  address: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hours: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
  }
});