import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

export default function ReviewItem({ review }) {
  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Отображение звезд рейтинга
  const renderStars = (rating) => {
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
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.userImage ? (
            <Image source={{ uri: review.userImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{review.userName.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.userName}>{review.userName}</Text>
        </View>
        <Text style={styles.date}>{formatDate(review.date)}</Text>
      </View>
      
      <View style={styles.ratingContainer}>
        <View style={styles.stars}>{renderStars(review.rating)}</View>
        <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
      </View>
      
      <Text style={styles.text}>{review.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    marginBottom: SIZES.padding.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SIZES.padding.sm,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
  },
  avatarText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
  userName: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  date: {
    ...FONTS.small,
    color: COLORS.text.light,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.sm,
  },
  stars: {
    flexDirection: 'row',
    marginRight: SIZES.padding.sm,
  },
  ratingText: {
    ...FONTS.caption,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  text: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
}); 