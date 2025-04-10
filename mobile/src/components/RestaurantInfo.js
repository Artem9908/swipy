import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

export default function RestaurantInfo({ restaurant, style }) {
  // Function to render rating stars
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color={COLORS.warning} />);
      } else if (i === fullStars && halfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color={COLORS.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color={COLORS.warning} />);
      }
    }
    
    return stars;
  };
  
  // Function to format hours
  const formatHours = (hours) => {
    if (!hours || !hours.length) return 'Hours not available';
    
    if (typeof hours === 'string') return hours;
    
    if (Array.isArray(hours)) {
      // Check if hours are in the format with day objects
      if (hours.length > 0 && typeof hours[0] === 'object' && hours[0].day) {
        const today = new Date().getDay();
        // Sunday in JavaScript is 0, but in our data it might be 6 or 7
        const todayIndex = today === 0 ? 6 : today - 1;
        const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today];
        
        const todayHours = hours.find(h => h.day === todayName);
        if (todayHours) {
          return `Today: ${todayHours.open} - ${todayHours.close}`;
        }
        
        // If we can't find by name, try by index
        if (hours[todayIndex]) {
          if (typeof hours[todayIndex] === 'string') {
            return `Today: ${hours[todayIndex].split(': ')[1] || hours[todayIndex]}`;
          } else if (hours[todayIndex].open) {
            return `Today: ${hours[todayIndex].open} - ${hours[todayIndex].close}`;
          }
        }
      }
      
      // If it's just an array of strings, show the first one
      return hours[0];
    }
    
    return 'Hours not available';
  };
  
  // Function to format address
  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    if (typeof address === 'string') return address;
    
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`;
  };
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.name}>{restaurant.name}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.cuisineContainer}>
          {restaurant.cuisine && (
            <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
          )}
        </View>
        {restaurant.priceRange && (
          <Text style={styles.price}>{restaurant.priceRange}</Text>
        )}
      </View>
      
      <View style={styles.ratingContainer}>
        <View style={styles.stars}>
          {renderRatingStars(restaurant.rating || 0)}
        </View>
        <Text style={styles.rating}>{restaurant.rating?.toFixed(1) || '0.0'}</Text>
        {restaurant.reviewCount && (
          <Text style={styles.reviewCount}>({restaurant.reviewCount} reviews)</Text>
        )}
      </View>
      
      {(restaurant.location || restaurant.address) && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={COLORS.text.secondary} style={styles.icon} />
          <Text style={styles.infoText}>
            {formatAddress(restaurant.address) || restaurant.location}
          </Text>
        </View>
      )}
      
      {restaurant.phone && (
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={COLORS.text.secondary} style={styles.icon} />
          <Text style={styles.infoText}>{restaurant.phone}</Text>
        </View>
      )}
      
      {restaurant.hours && (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.text.secondary} style={styles.icon} />
          <Text style={styles.infoText}>{formatHours(restaurant.hours)}</Text>
        </View>
      )}
      
      {restaurant.website && (
        <View style={styles.infoRow}>
          <Ionicons name="globe-outline" size={18} color={COLORS.text.secondary} style={styles.icon} />
          <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
            {restaurant.website}
          </Text>
        </View>
      )}
      
      {restaurant.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>About</Text>
          <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
            {restaurant.description}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding.md,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
  },
  name: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.sm,
  },
  cuisineContainer: {
    backgroundColor: COLORS.primary + '20', // 20% opacity
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.sm,
  },
  cuisine: {
    ...FONTS.caption,
    color: COLORS.primary,
  },
  price: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
  },
  stars: {
    flexDirection: 'row',
    marginRight: SIZES.padding.xs,
  },
  rating: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginRight: SIZES.padding.xs,
  },
  reviewCount: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.xs,
  },
  icon: {
    marginRight: SIZES.padding.xs,
  },
  infoText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: SIZES.padding.md,
  },
  descriptionTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.xs,
  },
  description: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  }
}); 