import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
  Animated,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function TournamentScreen({ navigation, route }) {
  const { user, savedRestaurants } = route.params || {};
  const [tournament, setTournament] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(0);
  const [winner, setWinner] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Ref for cancel token
  const cancelTokenRef = useRef(null);
  
  // Animation values
  const leftCardAnim = React.useRef(new Animated.Value(0)).current;
  const rightCardAnim = React.useRef(new Animated.Value(0)).current;
  
  // Cache restaurantsForTournament in state to avoid re-shuffling on rerenders
  const [initialRestaurants] = useState(
    savedRestaurants && savedRestaurants.length >= 2 
      ? [...savedRestaurants] 
      : []
  );
  
  // Use requestAnimationFrame to smooth out animations
  useEffect(() => {
    if (isFinished || !savedRestaurants || savedRestaurants.length < 2) return;
    
    // Only reset if we don't already have a tournament running
    if (tournament.length === 0) {
      console.log('Tournament parameters changed, resetting state');
      
      // Reset animations
      leftCardAnim.setValue(0);
      rightCardAnim.setValue(0);
      
      // Use initialRestaurants to avoid dependency on savedRestaurants
      // Shuffle the restaurants to randomize the tournament
      const shuffled = [...initialRestaurants].sort(() => 0.5 - Math.random());
      
      // Calculate total number of rounds based on restaurant count
      const rounds = Math.ceil(Math.log2(shuffled.length));
      setTotalRounds(rounds);
      
      // Initialize first round
      setTournament(shuffled);
      
      // Set the first pair
      setupNextPair(shuffled);
    }
    
    // Cleanup cancel tokens on unmount
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
        cancelTokenRef.current = null;
      }
    };
  }, [route.params?.timestamp]); // Only depend on timestamp for resets
  
  const setupNextPair = (currentTournament) => {
    if (!currentTournament || currentTournament.length <= 1) {
      // Tournament has ended, we have a winner
      if (currentTournament && currentTournament.length === 1) {
        setWinner(currentTournament[0]);
        setIsFinished(true);
        saveWinnerRestaurant(currentTournament[0]);
      }
      return;
    }
    
    // Get the next pair
    const pair = [currentTournament[0], currentTournament[1]];
    setCurrentPair(pair);
    
    // Reset animations
    leftCardAnim.setValue(0);
    rightCardAnim.setValue(0);
  };
  
  const selectRestaurant = (selectedIndex) => {
    // Animate the selected card
    if (selectedIndex === 0) {
      // Animate left card (winner)
      Animated.sequence([
        Animated.timing(leftCardAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false
        }),
        Animated.timing(leftCardAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
      
      // Animate right card (loser)
      Animated.timing(rightCardAnim, {
        toValue: -0.5,
        duration: 300,
        useNativeDriver: false
      }).start();
    } else {
      // Animate right card (winner)
      Animated.sequence([
        Animated.timing(rightCardAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false
        }),
        Animated.timing(rightCardAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
      
      // Animate left card (loser)
      Animated.timing(leftCardAnim, {
        toValue: -0.5,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
    
    // After animation, update tournament
    setTimeout(() => {
      const selected = currentPair[selectedIndex];
      const remaining = tournament.slice(2);
      
      // Add the winner to the next round
      const nextRound = [...remaining, selected];
      setTournament(nextRound);
      
      // Check if we're moving to the next round
      if (remaining.length === 0 || remaining.length === 1) {
        setRound(prevRound => prevRound + 1);
      }
      
      // Setup the next pair
      setupNextPair(nextRound);
    }, 500); // Wait for animation to finish
  };
  
  const saveWinnerRestaurant = async (restaurant) => {
    if (!user || !user._id) return;
    
    // Prevent multiple save attempts
    if (saving) return;
    
    try {
      setSaving(true);
      
      // Cancel any existing requests
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Operation canceled due to new request');
      }
      
      // Create a new cancel token
      cancelTokenRef.current = axios.CancelToken.source();
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/selected-restaurant` 
        : `http://192.168.0.82:5001/api/users/${user._id}/selected-restaurant`;
        
      await axios.post(apiUrl, {
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        image: restaurant.image,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange,
        rating: restaurant.rating,
        location: restaurant.location
      }, {
        cancelToken: cancelTokenRef.current.token
      });
      
      console.log('Selected restaurant saved successfully');
      
      // Update the user object in route params
      if (route.params) {
        const updatedUser = {
          ...user,
          selectedRestaurant: restaurant
        };
        
        // Update current route
        navigation.setParams({ user: updatedUser });
        
        // Try to update parent route as well
        const profileScreen = navigation.getParent();
        if (profileScreen && profileScreen.params) {
          profileScreen.setParams({ user: updatedUser });
        }
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error saving selected restaurant:', error);
        Alert.alert(
          'Error',
          'Could not save your selected restaurant. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSaving(false);
    }
  };
  
  const shareRestaurant = async () => {
    if (!winner) return;
    
    try {
      await Share.share({
        message: `I chose "${winner.restaurantName}" restaurant via Swipy! ${winner.location}`
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the restaurant');
    }
  };
  
  const shareWithFriend = () => {
    if (!winner || !user) return;
    
    // Navigate to Friends screen with restaurant data for sharing
    navigation.navigate('Friends', {
      user,
      shareMode: true,
      shareData: {
        type: 'tournament_winner',
        restaurantId: winner.restaurantId,
        restaurantName: winner.restaurantName,
        message: `I'd like to go to ${winner.restaurantName}! Would you like to join me?`,
        image: winner.image
      }
    });
  };
  
  const openOnMap = () => {
    if (!winner) return;
    
    const location = winner.location || '';
    const url = Platform.select({
      ios: `maps:0,0?q=${location}`,
      android: `geo:0,0?q=${location}`,
      default: `https://maps.google.com/?q=${location}`
    });
    
    navigation.navigate('RestaurantDetail', { 
      restaurant: {
        _id: winner.restaurantId,
        place_id: winner.restaurantId,
        name: winner.restaurantName,
        image: winner.image,
        cuisine: winner.cuisine,
        priceRange: winner.priceRange,
        rating: winner.rating,
        address: winner.location
      }, 
      user,
      openMap: true
    });
  };
  
  if (isFinished && winner) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Final Choice</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerTitle}>Here's where you want to go today 🎉</Text>
          
          <View style={styles.winnerCard}>
            <Image 
              source={{ uri: winner.image || 'https://via.placeholder.com/400?text=No+Image' }} 
              style={styles.winnerImage} 
            />
            <View style={styles.winnerInfo}>
              <Text style={styles.winnerName}>{winner.restaurantName}</Text>
              
              <View style={styles.winnerDetailsRow}>
                {winner.cuisine && (
                  <Text style={styles.winnerDetail}>{winner.cuisine}</Text>
                )}
                {winner.priceRange && (
                  <Text style={styles.winnerDetail}>{winner.priceRange}</Text>
                )}
                {winner.rating && (
                  <View style={styles.winnerRating}>
                    <Ionicons name="star" size={16} color={COLORS.warning} />
                    <Text style={styles.winnerDetail}>{winner.rating}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.winnerLocation}>
                <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.winnerLocationText} numberOfLines={2}>
                  {winner.location || 'Address not specified'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.winnerActions}>
            <TouchableOpacity 
              style={styles.winnerActionButton}
              onPress={shareRestaurant}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.winnerActionButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.winnerActionButton}
              onPress={shareWithFriend}
            >
              <Ionicons name="people" size={20} color="#fff" />
              <Text style={styles.winnerActionButtonText}>Invite Friends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.winnerActionButton}
              onPress={openOnMap}
            >
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.winnerActionButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
          
          {/* Button to view selected restaurant */}
          <TouchableOpacity 
            style={styles.viewSelectedButton}
            onPress={() => navigation.navigate('FinalChoice', { user })}
          >
            <Ionicons name="restaurant" size={20} color="#fff" />
            <Text style={styles.viewSelectedButtonText}>My Selected Restaurant</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Saved Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentPair.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Preparing tournament...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Scale animation for left card
  const leftScale = leftCardAnim.interpolate({
    inputRange: [-0.5, 0, 1],
    outputRange: [0.8, 1, 1.05]
  });
  
  // Scale animation for right card
  const rightScale = rightCardAnim.interpolate({
    inputRange: [-0.5, 0, 1],
    outputRange: [0.8, 1, 1.05]
  });
  
  // Opacity animation for cards
  const leftOpacity = leftCardAnim.interpolate({
    inputRange: [-0.5, 0],
    outputRange: [0.5, 1]
  });
  
  const rightOpacity = rightCardAnim.interpolate({
    inputRange: [-0.5, 0],
    outputRange: [0.5, 1]
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restaurant Selection</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.roundText}>Round {round} of {totalRounds}</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(round / totalRounds) * 100}%` }
            ]} 
          />
        </View>
      </View>
      
      <Text style={styles.instructions}>Choose the restaurant you want to visit</Text>
      
      <View style={styles.cardsContainer}>
        {/* Left Card */}
        <Animated.View 
          style={[
            styles.cardWrapper, 
            { 
              transform: [{ scale: leftScale }],
              opacity: leftOpacity
            }
          ]}
        >
          <TouchableOpacity
            style={styles.tournamentCard}
            onPress={() => selectRestaurant(0)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: currentPair[0].image || 'https://via.placeholder.com/400?text=No+Image' }} 
              style={styles.cardImage} 
            />
            <View style={styles.cardOverlay}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{currentPair[0].restaurantName}</Text>
                <View style={styles.cardDetails}>
                  {currentPair[0].cuisine && (
                    <Text style={styles.cardDetail}>{currentPair[0].cuisine}</Text>
                  )}
                  {currentPair[0].rating && (
                    <View style={styles.cardRating}>
                      <Ionicons name="star" size={14} color={COLORS.warning} />
                      <Text style={styles.cardDetail}>{currentPair[0].rating}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={styles.versusText}>VS</Text>
        
        {/* Right Card */}
        <Animated.View 
          style={[
            styles.cardWrapper, 
            { 
              transform: [{ scale: rightScale }],
              opacity: rightOpacity
            }
          ]}
        >
          <TouchableOpacity
            style={styles.tournamentCard}
            onPress={() => selectRestaurant(1)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: currentPair[1].image || 'https://via.placeholder.com/400?text=No+Image' }} 
              style={styles.cardImage} 
            />
            <View style={styles.cardOverlay}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{currentPair[1].restaurantName}</Text>
                <View style={styles.cardDetails}>
                  {currentPair[1].cuisine && (
                    <Text style={styles.cardDetail}>{currentPair[1].cuisine}</Text>
                  )}
                  {currentPair[1].rating && (
                    <View style={styles.cardRating}>
                      <Ionicons name="star" size={14} color={COLORS.warning} />
                      <Text style={styles.cardDetail}>{currentPair[1].rating}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.md,
  },
  closeButton: {
    padding: SIZES.padding.sm,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
  },
  progressContainer: {
    paddingHorizontal: SIZES.padding.lg,
    marginBottom: SIZES.padding.md,
  },
  roundText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  instructions: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginVertical: SIZES.padding.md,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.md,
  },
  cardWrapper: {
    width: width * 0.4,
    height: height * 0.5,
    ...SHADOWS.medium,
  },
  tournamentCard: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.padding.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardInfo: {
    width: '100%',
  },
  cardName: {
    ...FONTS.h3,
    color: COLORS.text.inverse,
    marginBottom: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardDetail: {
    ...FONTS.small,
    color: COLORS.text.inverse,
    marginRight: SIZES.padding.sm,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versusText: {
    ...FONTS.h1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
  winnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  winnerTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SIZES.padding.xl,
  },
  winnerCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  winnerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  winnerInfo: {
    padding: SIZES.padding.lg,
  },
  winnerName: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
  },
  winnerDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
  },
  winnerDetail: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginRight: SIZES.padding.md,
  },
  winnerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding.sm,
  },
  winnerLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  winnerLocationText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
    flex: 1,
  },
  winnerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SIZES.padding.xl,
  },
  winnerActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SIZES.padding.xs,
    ...SHADOWS.medium,
  },
  winnerActionButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    marginLeft: SIZES.padding.xs,
  },
  viewSelectedButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding.xl,
    width: '100%',
    ...SHADOWS.medium,
  },
  viewSelectedButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    marginLeft: SIZES.padding.xs,
  },
  backButton: {
    marginTop: SIZES.padding.xl,
    padding: SIZES.padding.md,
  },
  backButtonText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
}); 