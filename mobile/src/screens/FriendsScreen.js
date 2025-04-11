import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import AddFriendModal from '../components/AddFriendModal';

export default function FriendsScreen({ navigation, route }) {
  const { user, shareMode, shareData } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' или 'discover'
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [friendsStatus, setFriendsStatus] = useState({});
  
  useEffect(() => {
    if (shareMode) {
      console.log('Entered share mode, refreshing friends list');
      setActiveTab('friends');
      // Немедленно загружаем список друзей в режиме "Поделиться"
      fetchFriends();
    }
  }, [shareMode]);
  
  useEffect(() => {
    fetchUsers();
    fetchFriends();
    
    // Обновляем статусы друзей каждые 5 секунд (чаще для более актуальной информации)
    const statusInterval = setInterval(() => {
      if (friends.length > 0) {
        fetchFriendsStatus();
      }
    }, 5000);
    
    // Обновляем данные при возвращении на экран
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Friends screen focused, refreshing data');
      fetchFriends();
      if (friends.length > 0) {
        fetchFriendsStatus();
      }
    });
    
    return () => {
      clearInterval(statusInterval);
      unsubscribe();
    };
  }, [navigation]);
  
  // Pull-to-refresh функция
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUsers(false),
        fetchFriends(false),
        fetchFriendsStatus()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  const fetchUsers = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/users' 
        : 'http://192.168.0.82:5001/api/users';
        
      console.log('Fetching users from:', apiUrl);
      const res = await axios.get(apiUrl);
      console.log('Users API response:', res.data);
      
      // Исключаем текущего пользователя из списка
      const filteredUsers = res.data.filter(u => u._id !== user._id);
      console.log('Filtered users:', filteredUsers);
      setAllUsers(filteredUsers);
      return filteredUsers;
    } catch (e) {
      console.error('Error fetching users:', e);
      console.error('Error details:', e.response?.data || e.message);
      return [];
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchFriends = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/friends` 
        : `http://192.168.0.82:5001/api/users/${user._id}/friends`;
        
      const res = await axios.get(apiUrl);
      setFriends(res.data);
      
      // После получения списка друзей, запрашиваем их статусы
      if (res.data.length > 0) {
        fetchFriendsStatus(res.data);
      }
      
      return res.data;
    } catch (e) {
      console.error('Error fetching friends:', e);
      return [];
    } finally {
      if (showLoader) setLoading(false);
    }
  };
  
  const fetchFriendsStatus = async (friendsList = friends) => {
    if (!friendsList || !friendsList.length) return [];
    
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/status` 
        : `http://192.168.0.82:5001/api/users/status`;
        
      const friendIds = friendsList.map(friend => friend._id);
      const res = await axios.post(apiUrl, { userIds: friendIds });
      
      if (res.data && Array.isArray(res.data)) {
        const statusData = {};
        res.data.forEach(status => {
          if (status && status.userId) {
            statusData[status.userId] = status;
          }
        });
        
        setFriendsStatus(statusData);
        return statusData;
      }
      
      return {};
    } catch (e) {
      console.error('Error fetching friends status:', e);
      return {};
    }
  };

  const addFriend = async (friendId) => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/friends' 
        : 'http://192.168.0.82:5001/api/friends';
        
      await axios.post(apiUrl, { userId: user._id, friendId });
      // Обновляем список друзей
      fetchFriends();
      Alert.alert('Success', 'Friend added successfully!');
    } catch (e) {
      console.error('Error adding friend:', e);
      Alert.alert('Error', 'Could not add friend. Please try again.');
    }
  };

  const removeFriend = async (friendId) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const apiUrl = Platform.OS === 'web' 
                ? `http://localhost:5001/api/friends/${user._id}/${friendId}` 
                : `http://192.168.0.82:5001/api/friends/${user._id}/${friendId}`;
                
              await axios.delete(apiUrl);
              // Обновляем список друзей
              fetchFriends();
            } catch (e) {
              console.error('Error removing friend:', e);
              Alert.alert('Error', 'Could not remove friend. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = searchQuery 
    ? allUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers;
    
  const filteredFriends = searchQuery
    ? friends.filter(friend => 
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;
    
  const isFriend = (userId) => {
    return friends.some(friend => friend._id === userId);
  };
  
  const getFriendStatus = (friendId) => {
    const status = friendsStatus[friendId];
    
    if (!status) return null;
    
    if (status.isOnline) {
      return {
        text: 'Online',
        color: COLORS.success
      };
    } else if (status.lastSwipedAt && new Date(status.lastSwipedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return {
        text: 'Recently active',
        color: COLORS.warning
      };
    } else if (status.hasMatches) {
      return {
        text: 'Has restaurant matches',
        color: COLORS.primary
      };
    }
    
    return {
      text: 'Offline',
      color: COLORS.text.light
    };
  };

  const shareWithFriend = async (friendId) => {
    if (!shareData) return;
    
    try {
      console.log('Sharing with friend ID:', friendId, 'Data:', shareData);
      
      // Показываем краткий индикатор нажатия
      const friend = friends.find(f => f._id === friendId);
      const friendName = friend ? (friend.name || friend.username) : 'selected friend';
      
      Alert.alert(
        'Sending',
        `Opening chat with ${friendName}...`,
        [],
        { cancelable: false }
      );
      
      // Небольшая задержка, чтобы пользователь увидел уведомление
      setTimeout(() => {
        // Переходим на экран чата с выбранным другом
        navigation.navigate('Chat', { 
          user,
          friend: friends.find(f => f._id === friendId), // Передаем весь объект друга
          shareData: {
            ...shareData,
            friendId
          }
        });
      }, 800);
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert('Error', 'Could not open chat');
    }
  };

  const renderUserItem = ({ item }) => {
    const alreadyFriend = isFriend(item._id);
    const status = activeTab === 'friends' ? getFriendStatus(item._id) : null;
    
    return (
      <View style={styles.userCard}>
        <Image 
          source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=4ecdc4&color=fff` }} 
          style={styles.userAvatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
          
          {status && (
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          )}
        </View>
        
        {shareMode && activeTab === 'friends' ? (
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => shareWithFriend(item._id)}
          >
            <View style={styles.shareButtonContent}>
              <Ionicons name="share-social" size={20} color={COLORS.text.inverse} />
              <Text style={styles.shareButtonText}>Send</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <>
            {activeTab === 'discover' && (
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  alreadyFriend ? styles.actionButtonDisabled : null
                ]}
                onPress={() => addFriend(item._id)}
                disabled={alreadyFriend}
              >
                <Ionicons 
                  name={alreadyFriend ? "checkmark" : "person-add"} 
                  size={20} 
                  color={alreadyFriend ? COLORS.success : COLORS.primary} 
                />
              </TouchableOpacity>
            )}
            {activeTab === 'friends' && !shareMode && (
              <View style={styles.actionsContainer}>
                {status && status.text === 'Has restaurant matches' && (
                  <TouchableOpacity 
                    style={styles.matchButton}
                    onPress={() => navigation.navigate('Matches', { user, initialFriendId: item._id })}
                  >
                    <Ionicons name="restaurant" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => removeFriend(item._id)}
                >
                  <Ionicons name="person-remove" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    );
  };
  
  const handleAddFriendModalClose = (shouldRefresh = false) => {
    setAddFriendModalVisible(false);
    if (shouldRefresh) {
      fetchFriends();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {shareMode ? 'Share with a Friend' : 'Friends'}
        </Text>
        {!shareMode && (
          <TouchableOpacity 
            style={styles.addFriendButton}
            onPress={() => setAddFriendModalVisible(true)}
          >
            <Ionicons name="person-add" size={20} color={COLORS.text.inverse} />
            <Text style={styles.addFriendButtonText}>Add Friend</Text>
          </TouchableOpacity>
        )}
        {shareMode && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'friends' && styles.activeTab
          ]}
          onPress={() => !shareMode && setActiveTab('friends')}
          disabled={shareMode}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'friends' && styles.activeTabText
            ]}
          >
            My Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'discover' && styles.activeTab,
            shareMode && styles.disabledTab
          ]}
          onPress={() => !shareMode && setActiveTab('discover')}
          disabled={shareMode}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'discover' && styles.activeTabText,
              shareMode && styles.disabledTabText
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'friends' ? filteredFriends : filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'friends' ? "people" : "search"} 
                size={60} 
                color={COLORS.inactive} 
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'friends' 
                  ? 'You have no friends yet' 
                  : 'No users found'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'friends' 
                  ? 'Add friends to see them here' 
                  : 'Try changing your search parameters'}
              </Text>
            </View>
          }
        />
      )}
      
      <AddFriendModal 
        visible={addFriendModalVisible}
        onClose={handleAddFriendModalClose}
        userId={user._id}
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
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  addFriendButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.sm,
    paddingHorizontal: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  addFriendButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
    marginLeft: SIZES.padding.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SIZES.padding.md,
    paddingHorizontal: SIZES.padding.md,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SIZES.padding.sm,
  },
  searchInput: {
    flex: 1,
    height: 50,
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.padding.md,
    marginBottom: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.padding.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  listContent: {
    padding: SIZES.padding.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    marginBottom: SIZES.padding.md,
    ...SHADOWS.small,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SIZES.padding.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  userUsername: {
    ...FONTS.small,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radius.round,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    ...FONTS.small,
    fontWeight: '500',
  },
  actionButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonDisabled: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10', // 10% opacity
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  shareButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.primary,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
    marginLeft: SIZES.padding.xs,
  },
  cancelButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.round,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelButtonText: {
    ...FONTS.body,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  disabledTab: {
    opacity: 0.5,
  },
  disabledTabText: {
    color: COLORS.text.light,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: SIZES.padding.xs,
    backgroundColor: COLORS.primary + '10', // 10% opacity
  },
}); 