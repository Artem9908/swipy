import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import { useNotifications } from '../context/NotificationContext';

export default function MatchesScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [friends, setFriends] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendMatchCounts, setFriendMatchCounts] = useState({});
  const [previousMatchCounts, setPreviousMatchCounts] = useState({});
  const { showNotification } = useNotifications();

  useEffect(() => {
    loadData();
    
    // Add listener for screen focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadData(false);
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Handle initial friend selection if provided
  useEffect(() => {
    const { initialFriendId } = route.params || {};
    if (initialFriendId && friends.length > 0) {
      const foundFriend = friends.find(friend => friend._id === initialFriendId);
      if (foundFriend && friendMatchCounts[foundFriend._id] > 0) {
        setSelectedFriend(foundFriend);
      }
    }
  }, [friends, route.params]);

  // Сравниваем новое количество совпадений с предыдущим и показываем уведомления
  useEffect(() => {
    // Пропускаем первую загрузку
    if (Object.keys(previousMatchCounts).length === 0) {
      setPreviousMatchCounts({...friendMatchCounts});
      return;
    }

    // Проверяем, есть ли новые совпадения
    Object.keys(friendMatchCounts).forEach(friendId => {
      const currentCount = friendMatchCounts[friendId] || 0;
      const previousCount = previousMatchCounts[friendId] || 0;
      
      // Если появились новые совпадения
      if (currentCount > previousCount) {
        // Находим информацию о друге
        const friend = friends.find(f => f._id === friendId);
        if (friend) {
          // Получаем новые матчи
          const friendMatches = matches.filter(match => match.friendId === friendId);
          const newMatch = friendMatches[0]; // Берем первый матч для уведомления
          
          console.log('New match detected:', {
            friend: friend.name || friend.username,
            previousCount,
            currentCount,
            newMatch
          });
          
          // Создаем уведомление
          const notification = {
            id: Date.now().toString(),
            type: 'match',
            message: `У вас с ${friend.name || friend.username} совпал ресторан ${newMatch?.restaurantName || 'Ресторан'}!`,
            createdAt: new Date().toISOString(),
            read: false,
            data: {
              friendId: friendId,
              restaurantId: newMatch?.restaurantId,
              screen: 'Matches',
              params: { initialFriendId: friendId }
            }
          };
          
          // Показываем уведомление
          showNotification(notification);
          
          // Сохраняем на сервере
          saveNotification(notification);
        }
      }
    });
    
    // Обновляем предыдущие значения
    setPreviousMatchCounts({...friendMatchCounts});
  }, [friendMatchCounts]);
  
  // Сохранение уведомления на сервере
  const saveNotification = async (notification) => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/notifications' 
        : 'http://192.168.0.82:5001/api/notifications';
      
      console.log('Saving match notification to server:', notification);
      
      // Получаем информацию о текущем матче для этого друга
      const friendMatches = matches.filter(match => match.friendId === notification.data.friendId);
      const latestMatch = friendMatches.length > 0 ? friendMatches[0] : null;
      
      // Используем метод отправки тестового уведомления о совпадении
      const response = await axios.post(`${apiUrl}/test/match`, {
        userId: user._id,
        friendId: notification.data.friendId,
        restaurantId: notification.data.restaurantId || (latestMatch ? latestMatch.restaurantId : null),
        restaurantName: latestMatch ? latestMatch.restaurantName : 'Ресторан'
      });
      
      console.log('Match notification saved, server response:', response.data);
    } catch (error) {
      console.error('Error saving match notification:', error);
    }
  };
  
  const loadData = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    
    try {
      await Promise.all([
        fetchFriends(),
        fetchMatches()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load matches data');
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData(false);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  const fetchFriends = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/friends` 
        : `http://192.168.0.82:5001/api/users/${user._id}/friends`;
      
      const res = await axios.get(apiUrl);
      setFriends(res.data);
      return res.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  };
  
  const fetchMatches = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/matches` 
        : `http://192.168.0.82:5001/api/users/${user._id}/matches`;
      
      const res = await axios.get(apiUrl);
      setMatches(res.data);
      
      // Process match data to get count per friend
      const matchCounts = {};
      res.data.forEach(match => {
        matchCounts[match.friendId] = (matchCounts[match.friendId] || 0) + 1;
      });
      
      setFriendMatchCounts(matchCounts);
      return res.data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  };
  
  const getFriendMatches = (friendId) => {
    return matches.filter(match => match.friendId === friendId);
  };
  
  const sortedFriends = [...friends].sort((a, b) => {
    // Sort by match count, descending
    const aCount = friendMatchCounts[a._id] || 0;
    const bCount = friendMatchCounts[b._id] || 0;
    return bCount - aCount;
  });
  
  const renderFriendItem = ({ item }) => {
    const matchCount = friendMatchCounts[item._id] || 0;
    
    return (
      <TouchableOpacity 
        style={[
          styles.friendCard,
          selectedFriend && selectedFriend._id === item._id && styles.selectedFriendCard
        ]}
        onPress={() => setSelectedFriend(item)}
        disabled={matchCount === 0}
      >
        <Image 
          source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=4ecdc4&color=fff` }} 
          style={styles.friendAvatar} 
        />
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name || item.username}</Text>
          
          {matchCount > 0 ? (
            <View style={styles.matchBadge}>
              <Ionicons name="restaurant" size={14} color={COLORS.primary} />
              <Text style={styles.matchCount}>
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.noMatchText}>No matches yet</Text>
          )}
        </View>
        
        {matchCount > 0 && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={COLORS.text.secondary} 
          />
        )}
      </TouchableOpacity>
    );
  };
  
  const renderRestaurantItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        onPress={() => {
          navigation.navigate('RestaurantDetail', {
            restaurant: {
              _id: item.restaurantId,
              name: item.restaurantName,
              image: item.restaurantImage
            },
            user
          });
        }}
      >
        <Image 
          source={{ uri: item.restaurantImage || 'https://via.placeholder.com/300?text=No+Image' }} 
          style={styles.restaurantImage} 
        />
        
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Navigate to reservation screen
                navigation.navigate('Reservation', {
                  restaurant: {
                    _id: item.restaurantId,
                    name: item.restaurantName,
                    image: item.restaurantImage
                  },
                  user
                });
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.text.inverse} />
              <Text style={styles.actionButtonText}>Reserve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => {
                // Navigate to chat with the friend
                navigation.navigate('Chat', {
                  user,
                  friend: selectedFriend,
                  shareData: {
                    type: 'restaurant_match',
                    restaurantId: item.restaurantId,
                    restaurantName: item.restaurantName,
                    restaurantImage: item.restaurantImage,
                    message: `I see we both liked ${item.restaurantName}! Would you like to go together?`
                  }
                });
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.text.inverse} />
              <Text style={styles.actionButtonText}>Discuss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  const friendsWithMatches = friends.filter(friend => friendMatchCounts[friend._id] > 0);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurant Matches</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {friendsWithMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={80} color={COLORS.inactive} />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            When you and your friends like the same restaurants, they'll appear here
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.friendsContainer}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <FlatList
              horizontal
              data={sortedFriends}
              renderItem={renderFriendItem}
              keyExtractor={item => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                />
              }
            />
          </View>
          
          <View style={styles.restaurantsContainer}>
            {selectedFriend ? (
              <>
                <Text style={styles.sectionTitle}>
                  Matches with {selectedFriend.name || selectedFriend.username}
                </Text>
                
                <FlatList
                  data={getFriendMatches(selectedFriend._id)}
                  renderItem={renderRestaurantItem}
                  keyExtractor={(item, index) => `${item.restaurantId}-${index}`}
                  contentContainerStyle={styles.restaurantsList}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>No restaurant matches found</Text>
                    </View>
                  )}
                />
              </>
            ) : (
              <View style={styles.selectFriendContainer}>
                <Ionicons name="people-outline" size={60} color={COLORS.inactive} />
                <Text style={styles.selectFriendText}>
                  Select a friend to see matched restaurants
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
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
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  refreshButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background,
    ...SHADOWS.small,
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
  content: {
    flex: 1,
  },
  friendsContainer: {
    paddingTop: SIZES.padding.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    paddingHorizontal: SIZES.padding.md,
    marginBottom: SIZES.padding.sm,
  },
  friendsList: {
    paddingHorizontal: SIZES.padding.md,
    paddingBottom: SIZES.padding.md,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    marginRight: SIZES.padding.md,
    marginVertical: 2,
    ...SHADOWS.small,
    minWidth: 160,
  },
  selectedFriendCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.padding.sm,
  },
  friendInfo: {
    flex: 1,
    marginRight: SIZES.padding.xs,
  },
  friendName: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCount: {
    ...FONTS.small,
    color: COLORS.primary,
    marginLeft: 4,
  },
  noMatchText: {
    ...FONTS.small,
    color: COLORS.text.light,
    fontStyle: 'italic',
  },
  restaurantsContainer: {
    flex: 1,
    paddingTop: SIZES.padding.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  restaurantsList: {
    padding: SIZES.padding.md,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    marginBottom: SIZES.padding.md,
    ...SHADOWS.medium,
  },
  restaurantImage: {
    width: 120,
    height: 120,
  },
  restaurantInfo: {
    flex: 1,
    padding: SIZES.padding.md,
    justifyContent: 'space-between',
  },
  restaurantName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.xs,
    paddingHorizontal: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    marginRight: SIZES.padding.sm,
    ...SHADOWS.small,
  },
  actionButtonText: {
    ...FONTS.small,
    color: COLORS.text.inverse,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: COLORS.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.xl,
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
  },
  emptyListContainer: {
    padding: SIZES.padding.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
  selectFriendContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.xl,
  },
  selectFriendText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SIZES.padding.md,
  },
}); 