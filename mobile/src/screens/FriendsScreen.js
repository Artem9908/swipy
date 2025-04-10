import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import ActionButton from '../components/ActionButton';

export default function FriendsScreen({ navigation, route }) {
  const { user } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' или 'discover'

  useEffect(() => {
    fetchUsers();
    fetchFriends();
  }, []);

  const fetchUsers = async () => {
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
    } catch (e) {
      console.error('Error fetching users:', e);
      console.error('Error details:', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/friends` 
        : `http://192.168.0.82:5001/api/users/${user._id}/friends`;
        
      const res = await axios.get(apiUrl);
      setFriends(res.data);
    } catch (e) {
      console.error('Error fetching friends:', e);
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
      Alert.alert('Error', 'Failed to add friend. Please try again.');
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
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
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

  const renderUserItem = ({ item }) => {
    const alreadyFriend = isFriend(item._id);
    
    return (
      <View style={styles.userCard}>
        <Image 
          source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=4ecdc4&color=fff` }} 
          style={styles.userAvatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
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
        {activeTab === 'friends' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => removeFriend(item._id)}
          >
            <Ionicons name="person-remove" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
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
          onPress={() => setActiveTab('friends')}
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
            activeTab === 'discover' && styles.activeTab
          ]}
          onPress={() => setActiveTab('discover')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'discover' && styles.activeTabText
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'friends' ? "people" : "search"} 
                size={60} 
                color={COLORS.inactive} 
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'friends' 
                  ? 'No friends yet' 
                  : 'No users found'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'friends' 
                  ? 'Start adding friends to see them here' 
                  : 'Try a different search term'}
              </Text>
            </View>
          }
        />
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
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
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
}); 