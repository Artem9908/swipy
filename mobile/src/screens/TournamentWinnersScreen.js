import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Platform } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function TournamentWinnersScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [tournamentWinners, setTournamentWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournamentWinners();
  }, []);

  const fetchTournamentWinners = async () => {
    if (!user || !user._id) {
      setError('Пользователь не найден');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/tournament-winners` 
        : `http://192.168.0.82:5001/api/users/${user._id}/tournament-winners`;
        
      const response = await axios.get(apiUrl);
      console.log('Загруженные победители турниров:', response.data);
      if (response.data && Array.isArray(response.data)) {
        // Deduplicate based on restaurantId, keeping the last (most recent) entry if sorted by date
        const uniqueWinnersMap = response.data.reduce((map, obj) => {
          // We only add or update if the restaurantId is valid
          if (obj.restaurantId) {
            map.set(obj.restaurantId, obj);
          }
          return map;
        }, new Map());
        
        const uniqueWinners = Array.from(uniqueWinnersMap.values());
        
        // Sort by date descending (newest first)
        uniqueWinners.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log('Отфильтрованные и отсортированные победители:', uniqueWinners);
        setTournamentWinners(uniqueWinners);
        
      } else {
        setTournamentWinners(response.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке победителей турниров:', error);
      setError('Не удалось загрузить рестораны. Пожалуйста, попробуйте позже.');
      setLoading(false);
    }
  };

  const navigateToRestaurantDetail = (restaurant) => {
    navigation.navigate('RestaurantDetail', {
      restaurant: {
        _id: restaurant.restaurantId,
        name: restaurant.restaurantName,
        image: restaurant.image
      },
      user
    });
  };

  const renderRestaurantItem = ({ item }) => {
    const date = item.createdAt ? new Date(item.createdAt) : new Date();
    const formattedDate = date.toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={styles.restaurantItem}
        onPress={() => navigateToRestaurantDetail(item)}
      >
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/100?text=Restaurant' }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
        
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          
          {item.cuisine && (
            <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
          )}
          
          <View style={styles.detailsRow}>
            {item.priceRange && (
              <Text style={styles.restaurantPrice}>{item.priceRange}</Text>
            )}
            
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.secondary} />
                <Text style={styles.restaurantRating}>{item.rating}</Text>
              </View>
            )}
            
            <Text style={styles.tournamentDate}>Выбран: {formattedDate}</Text>
          </View>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={COLORS.primary} 
          style={styles.chevron} 
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка ресторанов...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorTitle}>Ошибка</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTournamentWinners}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (tournamentWinners.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Победители турниров</Text>
        </View>
        
        <View style={styles.centerContainer}>
          <Ionicons name="trophy-outline" size={80} color={COLORS.inactive} />
          <Text style={styles.emptyTitle}>Нет победителей турниров</Text>
          <Text style={styles.emptyText}>
            Вы еще не выбрали рестораны через турнир.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('Tournament', { user })}
          >
            <Text style={styles.startButtonText}>Начать турнир</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Победители турниров</Text>
      </View>
      
      <FlatList
        data={tournamentWinners}
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item.restaurantId || item._id || String(Math.random())}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchTournamentWinners}
        refreshing={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SIZES.padding.xs,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.md,
  },
  listContainer: {
    padding: SIZES.padding.md,
  },
  restaurantItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.padding.md,
    padding: SIZES.padding.md,
    ...SHADOWS.small,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius.sm,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: SIZES.padding.md,
    justifyContent: 'center',
  },
  restaurantName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  restaurantCuisine: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  restaurantPrice: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
  },
  restaurantRating: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
    marginLeft: 2,
  },
  tournamentDate: {
    ...FONTS.caption,
    color: COLORS.text.primary,
    opacity: 0.7,
  },
  chevron: {
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.xl,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.md,
  },
  errorTitle: {
    ...FONTS.h2,
    color: COLORS.error,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.sm,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  retryButtonText: {
    ...FONTS.button,
    color: COLORS.text.inverse,
  },
  emptyTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.sm,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  startButtonText: {
    ...FONTS.button,
    color: COLORS.text.inverse,
  },
}); 