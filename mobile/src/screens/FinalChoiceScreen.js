import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function FinalChoiceScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user._id) {
      setError('User information not available');
      setLoading(false);
      return;
    }
    
    fetchSelectedRestaurant();
  }, []);
  
  const fetchSelectedRestaurant = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/selected-restaurant` 
        : `http://192.168.0.82:5001/api/users/${user._id}/selected-restaurant`;
        
      const response = await axios.get(apiUrl);
      setSelectedRestaurant(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching selected restaurant:', error);
      if (error.response && error.response.status === 404) {
        setError('You have not selected a final restaurant yet');
      } else {
        setError('Could not load your selection');
      }
      setLoading(false);
    }
  };
  
  const openOnMap = () => {
    if (!selectedRestaurant || !selectedRestaurant.location) return;
    
    const location = selectedRestaurant.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${location}`,
      android: `geo:0,0?q=${location}`,
      default: `https://maps.google.com/?q=${location}`
    });
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening map:', err);
      Alert.alert('Error', 'Could not open map application');
    });
  };
  
  const shareWithFriend = () => {
    if (!selectedRestaurant || !user) return;
    
    // Navigate to Friends screen with restaurant data for sharing
    navigation.navigate('Friends', {
      user,
      shareMode: true,
      shareData: {
        type: 'final_choice',
        restaurantId: selectedRestaurant.restaurantId,
        restaurantName: selectedRestaurant.restaurantName,
        message: `I'd like to go to ${selectedRestaurant.restaurantName}! Would you like to join me?`,
        image: selectedRestaurant.image
      }
    });
  };
  
  const viewRestaurantDetails = () => {
    if (!selectedRestaurant) return;
    
    navigation.navigate('RestaurantDetail', { 
      restaurant: {
        _id: selectedRestaurant.restaurantId,
        place_id: selectedRestaurant.restaurantId,
        name: selectedRestaurant.restaurantName,
        image: selectedRestaurant.image,
        cuisine: selectedRestaurant.cuisine,
        priceRange: selectedRestaurant.priceRange,
        rating: selectedRestaurant.rating,
        address: selectedRestaurant.location
      }, 
      user
    });
  };
  
  const findNewRestaurant = () => {
    navigation.navigate('SavedRestaurants', {
      user,
      startTournament: true
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Selected Restaurant</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your selection...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Selected Restaurant</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="restaurant-outline" size={80} color={COLORS.inactive} />
          <Text style={styles.errorTitle}>No Selection Found</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.findRestaurantButton}
            onPress={findNewRestaurant}
          >
            <Text style={styles.findRestaurantButtonText}>Find a Restaurant</Text>
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
        <Text style={styles.headerTitle}>My Selected Restaurant</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.restaurantContainer}>
          <View style={styles.restaurantCard}>
            <Image 
              source={{ uri: selectedRestaurant.image || 'https://via.placeholder.com/400?text=No+Image' }} 
              style={styles.restaurantImage} 
            />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{selectedRestaurant.restaurantName}</Text>
              
              <View style={styles.restaurantDetailsRow}>
                {selectedRestaurant.cuisine && (
                  <Text style={styles.restaurantDetail}>{selectedRestaurant.cuisine}</Text>
                )}
                {selectedRestaurant.priceRange && (
                  <Text style={styles.restaurantDetail}>{selectedRestaurant.priceRange}</Text>
                )}
                {selectedRestaurant.rating && (
                  <View style={styles.restaurantRating}>
                    <Ionicons name="star" size={16} color={COLORS.warning} />
                    <Text style={styles.restaurantDetail}>{selectedRestaurant.rating}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.restaurantLocation}>
                <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.restaurantLocationText} numberOfLines={2}>
                  {selectedRestaurant.location || 'Address not specified'}
                </Text>
              </View>
              
              <Text style={styles.selectedTimeText}>
                Selected on: {new Date(selectedRestaurant.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.mapButton} onPress={openOnMap}>
              <Ionicons name="map-outline" size={20} color={COLORS.text.inverse} />
              <Text style={styles.buttonText}>Open on Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton} onPress={shareWithFriend}>
              <Ionicons name="people-outline" size={20} color={COLORS.text.inverse} />
              <Text style={styles.buttonText}>Invite a Friend</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.viewDetailsButton} 
            onPress={viewRestaurantDetails}
          >
            <Text style={styles.viewDetailsButtonText}>View Restaurant Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.newSelectionButton} 
            onPress={findNewRestaurant}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
            <Text style={styles.newSelectionButtonText}>Make a New Selection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
  },
  backButton: {
    padding: SIZES.padding.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  errorTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.sm,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
  },
  findRestaurantButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  findRestaurantButtonText: {
    ...FONTS.button,
    color: COLORS.text.inverse,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  restaurantContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  restaurantCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  restaurantInfo: {
    padding: SIZES.padding.lg,
  },
  restaurantName: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
  },
  restaurantDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
    flexWrap: 'wrap',
  },
  restaurantDetail: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.md,
    marginBottom: SIZES.padding.xs,
  },
  restaurantRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
  },
  restaurantLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding.md,
  },
  restaurantLocationText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
    flex: 1,
  },
  selectedTimeText: {
    ...FONTS.small,
    color: COLORS.text.light,
    fontStyle: 'italic',
    marginTop: SIZES.padding.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SIZES.padding.lg,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
    ...SHADOWS.medium,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.padding.sm,
    ...SHADOWS.medium,
  },
  buttonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    marginLeft: SIZES.padding.xs,
  },
  viewDetailsButton: {
    marginTop: SIZES.padding.lg,
    padding: SIZES.padding.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    width: '100%',
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
  },
  newSelectionButton: {
    marginTop: SIZES.padding.lg,
    padding: SIZES.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSelectionButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    marginLeft: SIZES.padding.xs,
  },
}); 