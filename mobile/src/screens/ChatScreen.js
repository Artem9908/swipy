import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function ChatScreen({ route, navigation }) {
  const { user, friend } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(friend || null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchFriends();
    fetchMatches();
    fetchMessages();
  }, [selectedFriend]);

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

  const fetchMatches = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/matches` 
        : `http://192.168.0.82:5001/api/users/${user._id}/matches`;
        
      const res = await axios.get(apiUrl);
      setMatches(res.data);
    } catch (e) {
      console.error('Error fetching matches:', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/chat' 
        : 'http://192.168.0.82:5001/api/chat';
        
      const res = await axios.get(apiUrl);
      
      if (selectedFriend) {
        // Если выбран конкретный друг, показываем только сообщения между ними
        const conversationMessages = res.data.filter(
          msg => (msg.userId === user._id && msg.recipientId === selectedFriend._id) || 
                 (msg.userId === selectedFriend._id && msg.recipientId === user._id)
        );
        setMessages(conversationMessages);
      } else {
        // Иначе показываем все сообщения пользователя
        const userMessages = res.data.filter(
          msg => msg.userId === user._id || msg.recipientId === user._id
        );
        setMessages(userMessages);
      }
      
      setLoading(false);
      
      // Прокручиваем к последнему сообщению
      if (flatListRef.current && messages.length > 0) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedFriend) return;
    
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/chat' 
        : 'http://192.168.0.82:5001/api/chat';
        
      await axios.post(apiUrl, {
        userId: user._id,
        recipientId: selectedFriend._id,
        text,
        timestamp: new Date().toISOString()
      });
      
      setText('');
      fetchMessages();
      
      // Прокручиваем к новому сообщению
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 200);
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const selectFriend = (friend) => {
    setSelectedFriend(friend);
  };

  const getMatchedRestaurants = (friendId) => {
    return matches
      .filter(match => match.friendId === friendId)
      .map(match => match.restaurant);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = (username) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4ecdc4&color=fff`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
      </View>
      
      <View style={styles.friendsContainer}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        <FlatList
          horizontal
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.friendItem,
                selectedFriend && selectedFriend._id === item._id && styles.selectedFriend
              ]}
              onPress={() => selectFriend(item)}
            >
              <Image 
                source={{ uri: getAvatarUrl(item.username) }} 
                style={styles.friendAvatar} 
              />
              <Text style={[
                styles.friendName,
                selectedFriend && selectedFriend._id === item._id && styles.selectedFriendText
              ]}>
                {item.username}
              </Text>
              {getMatchedRestaurants(item._id).length > 0 && (
                <View style={styles.matchBadge}>
                  <Text style={styles.matchCount}>{getMatchedRestaurants(item._id).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.friendsList}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      <View style={styles.messagesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedFriend ? `Chat with ${selectedFriend.username}` : 'Select a friend to chat'}
        </Text>
        
        {selectedFriend ? (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={[
                  styles.messageItem,
                  item.userId === user._id ? styles.sentMessage : styles.receivedMessage
                ]}>
                  {item.userId !== user._id && (
                    <Image 
                      source={{ uri: getAvatarUrl(selectedFriend.username) }} 
                      style={styles.messageAvatar} 
                    />
                  )}
                  <View style={[
                    styles.messageBubble,
                    item.userId === user._id ? styles.sentBubble : styles.receivedBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      item.userId === user._id ? styles.sentMessageText : styles.receivedMessageText
                    ]}>
                      {item.text}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.messagesList}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.text.light}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={sendMessage}
                disabled={!text.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={24} 
                  color={text.trim() ? COLORS.primary : COLORS.inactive} 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color={COLORS.inactive} />
            <Text style={styles.emptyTitle}>No Conversation Selected</Text>
            <Text style={styles.emptyText}>
              Select a friend from the list above to start chatting
            </Text>
          </View>
        )}
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
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
    paddingHorizontal: SIZES.padding.md,
  },
  friendsContainer: {
    marginBottom: SIZES.padding.md,
    paddingTop: SIZES.padding.sm,
  },
  friendsList: {
    paddingHorizontal: SIZES.padding.md,
  },
  friendItem: {
    padding: SIZES.padding.sm,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    marginRight: SIZES.padding.md,
    minWidth: 80,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  selectedFriend: {
    backgroundColor: COLORS.primary,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: SIZES.padding.xs,
  },
  friendName: {
    ...FONTS.body,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  selectedFriendText: {
    color: COLORS.text.inverse,
  },
  matchBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCount: {
    ...FONTS.caption,
    fontWeight: 'bold',
    color: COLORS.text.inverse,
  },
  messagesContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.padding.sm,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: SIZES.padding.md,
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    marginBottom: SIZES.padding.md,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: SIZES.padding.xs,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.small,
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 0,
  },
  receivedBubble: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 0,
  },
  messageText: {
    ...FONTS.body,
  },
  sentMessageText: {
    color: COLORS.text.inverse,
  },
  receivedMessageText: {
    color: COLORS.text.primary,
  },
  timestamp: {
    ...FONTS.caption,
    color: COLORS.text.light,
    alignSelf: 'flex-end',
    marginTop: SIZES.padding.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SIZES.padding.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    marginRight: SIZES.padding.sm,
    backgroundColor: COLORS.card,
    ...FONTS.body,
    color: COLORS.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
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
});