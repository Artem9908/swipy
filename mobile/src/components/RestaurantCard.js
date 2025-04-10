import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
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
  
  // Get the first image or use a placeholder
  const imageSource = restaurant.photos && restaurant.photos.length > 0 
    ? { uri: restaurant.photos[0] } 
    : restaurant.image 
      ? { uri: restaurant.image }
      : { uri: 'https://via.placeholder.com/400x300?text=No+Image' };
  
  // Format address
  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    if (typeof address === 'string') return address;
    
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`;
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
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        
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
              </View>
            )}
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.address} numberOfLines={2}>
              {restaurant.address ? formatAddress(restaurant.address) : restaurant.location || 'Address not available'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  cardInner: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '70%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.sm,
    borderWidth: 3,
    borderRadius: SIZES.radius.md,
    transform: [{ rotate: '30deg' }],
    zIndex: 10,
  },
  likeOverlay: {
    right: 20,
    borderColor: COLORS.success,
  },
  dislikeOverlay: {
    left: 20,
    borderColor: COLORS.error,
  },
  overlayText: {
    ...FONTS.h2,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: SIZES.padding.lg,
    flex: 1,
  },
  name: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
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
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
    flex: 1,
  }
});