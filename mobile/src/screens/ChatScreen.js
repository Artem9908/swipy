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
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

export default function ChatScreen({ route, navigation }) {
  const { user, friend, shareData } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState(shareData?.message || '');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(friend || null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    console.log('Chat screen mounted, user:', user);
    
    // Проверка наличия данных о пользователе
    if (!user || !user._id) {
      console.log('No user data, stopping loading');
      setError('Could not load user data');
      setLoading(false);
      return;
    }
    
    // Установка флага для предотвращения рекурсивных вызовов
    let isMounted = true;
    
    // Добавляем обработчик фокуса для обновления данных при возвращении на экран
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Chat screen focused, refreshing data');
      if (isMounted) {
        fetchFriends()
          .then(() => {
            if (selectedFriend) {
              fetchMessages(false);
            }
          })
          .catch(err => console.error('Error refreshing on focus:', err));
      }
    });
    
    // Сначала загружаем друзей, затем чаты
    const loadInitialData = async () => {
      try {
        const friendsList = await fetchFriends();
        console.log('Friends loaded initially:', friendsList);
        
        // Выход если компонент размонтирован
        if (!isMounted) return;
        
        // Для функционала "Поделиться" - если указан friendId, находим друга и устанавливаем его
        if (shareData && shareData.friendId) {
          console.log('Share data detected, searching for friend with ID:', shareData.friendId);
          // Находим друга в загруженном списке
          const friendToSelect = friendsList.find(f => f._id === shareData.friendId);
          if (friendToSelect) {
            console.log('Friend found, setting as selected:', friendToSelect.name || friendToSelect.username);
            setSelectedFriend(friendToSelect);
            // Установка текста сообщения из shareData
            if (shareData.message) {
              setText(shareData.message);
            }
          } else {
            console.log('Friend not found in the list, friendId:', shareData.friendId);
            setError('Could not find the selected friend');
          }
        } else {
          await fetchMessages();
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        if (isMounted) {
          setError('Could not load data. Please check your connection.');
          setLoading(false);
        }
      }
    };
    
    loadInitialData();
    fetchMatches();
    
    // Очистка при размонтировании
    return () => {
      isMounted = false;
      unsubscribeFocus();
    };
  }, [navigation]);

  useEffect(() => {
    if (selectedFriend) {
      console.log('Selected friend changed to:', selectedFriend.name || selectedFriend.username);
      
      // Загрузка сообщений при выборе друга
      fetchMessages(false);
      
      // Если есть данные для шеринга и выбран конкретный друг, отправляем сообщение автоматически
      if (shareData && shareData.message) {
        console.log('Will send share message for restaurant:', shareData.restaurantName);
        // Немедленно отправляем сообщение
        sendShareMessage();
      }
      
      // Устанавливаем интервал для периодического обновления чата
      const chatRefreshInterval = setInterval(() => {
        if (selectedFriend) {
          fetchMessages(false); // не показываем индикатор загрузки при обновлении
        }
      }, 3000); // обновляем каждые 3 секунды
      
      // Очищаем интервал при размонтировании или смене друга
      return () => {
        console.log('Clearing chat refresh interval');
        clearInterval(chatRefreshInterval);
      };
    } else {
      console.log('No friend selected, showing friend list');
    }
  }, [selectedFriend]);

  // Получить информацию о друге по ID
  const fetchFriendDetails = async (friendId) => {
    try {
      // Ищем друга в списке
      const friend = friends.find(f => f._id === friendId);
      if (friend) {
        setSelectedFriend(friend);
      }
    } catch (e) {
      console.error('Error fetching friend details:', e);
    }
  };

  // Отправить автоматическое сообщение с предложением ресторана
  const sendShareMessage = async () => {
    if (!shareData || !selectedFriend || !user || !user._id) {
      console.log('Cannot send share message - missing data', { 
        hasShareData: !!shareData, 
        hasSelectedFriend: !!selectedFriend, 
        hasUser: !!user 
      });
      return;
    }
    
    try {
      console.log('Sending share message for restaurant:', shareData.restaurantName);
      const message = shareData.message || `Hi! Check out this restaurant: ${shareData.restaurantName}. I think you'll like it!`;
      
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/chat' 
        : 'http://192.168.0.82:5001/api/chat';
        
      const response = await axios.post(apiUrl, {
        userId: user._id,
        recipientId: selectedFriend._id,
        text: message,
        timestamp: new Date().toISOString()
      });
      
      console.log('Share message sent successfully:', response.data);
      
      // Добавляем новое сообщение в список сразу, не дожидаясь обновления
      const newMessage = response.data;
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Очищаем данные шеринга, чтобы не отправлять повторно
      navigation.setParams({ shareData: null });
      setText('');
      
      // Прокручиваем к новому сообщению
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // Показываем уведомление пользователю
      Alert.alert(
        'Success!',
        `Message about ${shareData.restaurantName} restaurant has been sent`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (e) {
      console.error('Error sending share message:', e);
      Alert.alert('Error', 'Failed to send restaurant message');
    }
  };

  const fetchFriends = async () => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/friends` 
        : `http://192.168.0.82:5001/api/users/${user._id}/friends`;
        
      console.log(`Fetching friends from: ${apiUrl}`);
      const res = await axios.get(apiUrl);
      console.log(`Received ${res.data.length} friends`);
      
      // Проверяем, что ответ является массивом
      if (!Array.isArray(res.data)) {
        console.error('Invalid friends data format, expected array');
        setError('Invalid friends data format');
        return [];
      }
      
      setFriends(res.data);
      return res.data;
    } catch (e) {
      console.error('Error fetching friends:', e);
      setError('Could not load friends list');
      return [];
    }
  };

  const fetchMatches = async () => {
    if (!user || !user._id) return;
    
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/matches` 
        : `http://192.168.0.82:5001/api/users/${user._id}/matches`;
        
      const res = await axios.get(apiUrl);
      console.log('Fetched matches:', res.data);
      setMatches(res.data);
    } catch (e) {
      console.error('Error fetching matches:', e);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (!user || !user._id) {
      console.log('No user data in fetchMessages');
      setLoading(false);
      return;
    }
    
    if (showLoading) setLoading(true);
    
    // Добавляем защиту от длительной загрузки
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    try {
      if (selectedFriend) {
        // Получаем сообщения для конкретного диалога
        const apiUrl = Platform.OS === 'web' 
          ? `http://localhost:5001/api/chat/${user._id}/${selectedFriend._id}` 
          : `http://192.168.0.82:5001/api/chat/${user._id}/${selectedFriend._id}`;
          
        console.log(`Fetching messages for chat with: ${selectedFriend.username}`);
        
        // Используем Promise.race для таймаута запроса
        const res = await Promise.race([
          axios.get(apiUrl),
          timeoutPromise
        ]);
        
        console.log('Fetched messages:', res.data);
        
        // Проверяем, что ответ является массивом
        if (!Array.isArray(res.data)) {
          console.error('Invalid messages data format, expected array');
          setError('Invalid messages data format');
          setLoading(false);
          return;
        }
        
        setMessages(res.data);
      } else {
        // Получаем список собеседников с последними сообщениями
        const apiUrl = Platform.OS === 'web' 
          ? `http://localhost:5001/api/chat/${user._id}` 
          : `http://192.168.0.82:5001/api/chat/${user._id}`;
          
        console.log('Fetching conversations from:', apiUrl);
        
        // Используем Promise.race для таймаута запроса
        const res = await Promise.race([
          axios.get(apiUrl),
          timeoutPromise
        ]);
        
        console.log('Fetched conversations:', res.data);
        
        // Проверяем, что ответ является массивом
        if (!Array.isArray(res.data)) {
          console.error('Invalid conversations data format, expected array');
          setLoading(false);
          return;
        }
        
        // Обрабатываем полученных собеседников
        const conversationUsers = res.data;
        
        // Если есть собеседники и у нас есть друзья в списке
        if (conversationUsers.length > 0 && friends.length > 0) {
          // Находим пользователя в списке друзей
          const otherUserId = conversationUsers[0]._id;
          const friend = friends.find(f => f._id === otherUserId);
          
          if (friend) {
            console.log('Setting selected friend:', friend);
            setSelectedFriend(friend);
            // Запрашиваем сообщения для этого диалога
            const messagesApiUrl = Platform.OS === 'web' 
              ? `http://localhost:5001/api/chat/${user._id}/${friend._id}` 
              : `http://192.168.0.82:5001/api/chat/${user._id}/${friend._id}`;
              
            const messagesRes = await axios.get(messagesApiUrl);
            console.log('Fetched messages for first conversation:', messagesRes.data);
            
            // Проверка формата данных
            if (Array.isArray(messagesRes.data)) {
              setMessages(messagesRes.data);
            } else {
              console.error('Invalid messages data format');
            }
          } else {
            console.log('Friend not found in friends list:', otherUserId);
          }
        }
        
        // В любом случае завершаем загрузку
        setLoading(false);
      }
      
      // Прокручиваем к последнему сообщению
      if (flatListRef.current && messages.length > 0) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (e) {
      if (e.message === 'Timeout') {
        console.error('Request timed out');
        setError('Request timed out');
      } else {
        console.error('Error fetching messages:', e);
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Улучшенная функция отправки обычного сообщения
  const sendMessage = async () => {
    if (!text.trim() || !selectedFriend || !user || !user._id) return;
    
    // Проверяем, не осталось ли shareData, и если есть - очищаем
    if (shareData) {
      navigation.setParams({ shareData: null });
    }
    
    try {
      console.log('Sending message:', {
        userId: user._id,
        recipientId: selectedFriend._id,
        text,
      });
      
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/chat' 
        : 'http://192.168.0.82:5001/api/chat';
        
      const response = await axios.post(apiUrl, {
        userId: user._id,
        recipientId: selectedFriend._id,
        text,
        timestamp: new Date().toISOString()
      });
      
      console.log('Message sent response:', response.data);
      
      // Добавляем новое сообщение в список, не дожидаясь перезагрузки
      const newMessage = response.data;
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      setText('');
      
      // Прокручиваем к новому сообщению
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (e) {
      console.error('Error sending message:', e);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const selectFriend = (friend) => {
    setSelectedFriend(friend);
  };

  const getMatchedRestaurants = (friendId) => {
    return matches.filter(match => match.friendId === friendId);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = (username) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4ecdc4&color=fff`;
  };

  // Функция для обновления данных при ручном обновлении
  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await fetchFriends();
      if (selectedFriend) {
        await fetchMessages(false);
      } else {
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      setError('Could not refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchFriends()
              .then(() => fetchMessages())
              .catch(err => setError('Could not connect to server'));
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        {error && (
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.friendsContainer}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        {friends.length > 0 ? (
          <FlatList
            horizontal
            data={friends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              // Находим последнее сообщение для этого друга
              const lastMessage = messages.find(msg => 
                (msg.userId === item._id && msg.recipientId === user._id) || 
                (msg.userId === user._id && msg.recipientId === item._id)
              );
              
              // Определяем, есть ли непрочитанные сообщения
              const hasUnread = messages.some(msg => 
                msg.userId === item._id && 
                msg.recipientId === user._id && 
                !msg.read
              );
              
              return (
                <TouchableOpacity
                  style={[
                    styles.friendItem,
                    selectedFriend && selectedFriend._id === item._id && styles.selectedFriend,
                    hasUnread && styles.unreadFriend
                  ]}
                  onPress={() => selectFriend(item)}
                >
                  <Image 
                    source={{ uri: getAvatarUrl(item.username) }} 
                    style={styles.friendAvatar} 
                  />
                  <Text style={[
                    styles.friendName,
                    selectedFriend && selectedFriend._id === item._id && styles.selectedFriendText,
                    hasUnread && styles.unreadFriendText
                  ]}>
                    {item.name || item.username}
                  </Text>
                  {lastMessage && (
                    <Text style={styles.lastMessagePreview} numberOfLines={1} ellipsizeMode="tail">
                      {lastMessage.text.substring(0, 15)}
                      {lastMessage.text.length > 15 ? '...' : ''}
                    </Text>
                  )}
                  {hasUnread && (
                    <View style={styles.unreadBadge} />
                  )}
                  {getMatchedRestaurants(item._id).length > 0 && (
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchCount}>{getMatchedRestaurants(item._id).length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.friendsList}
            showsHorizontalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
          />
        ) : (
          <View style={styles.noFriendsContainer}>
            <Text style={styles.noFriendsText}>
              You don't have any friends yet. Add friends to start chatting.
            </Text>
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => navigation.navigate('Friends', { user })}
            >
              <Text style={styles.addFriendButtonText}>Add Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.messagesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedFriend 
            ? `Chat with ${selectedFriend.name || selectedFriend.username}` 
            : 'Select a friend to start chatting'}
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
              keyExtractor={(item, index) => item.id || index.toString()}
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                />
              }
              ListHeaderComponent={() => {
                // Получаем совпадения ресторанов с текущим собеседником
                const friendMatches = selectedFriend ? getMatchedRestaurants(selectedFriend._id) : [];
                
                if (friendMatches.length === 0) return null;
                
                return (
                  <View style={styles.matchesContainer}>
                    <View style={styles.matchesHeader}>
                      <Text style={styles.matchesTitle}>Restaurant Matches</Text>
                      {friendMatches.length > 3 && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Matches', { user, initialFriendId: selectedFriend._id })}
                        >
                          <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <FlatList 
                      horizontal
                      data={friendMatches.slice(0, 3)} // Show only first 3 matches
                      keyExtractor={(item) => item.restaurantId}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={styles.matchedRestaurantItem}
                          onPress={() => {
                            // Переход на экран ресторана
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
                            source={{ uri: item.restaurantImage || 'https://via.placeholder.com/100?text=Restaurant' }}
                            style={styles.matchedRestaurantImage}
                          />
                          <Text style={styles.matchedRestaurantName} numberOfLines={2}>
                            {item.restaurantName}
                          </Text>
                        </TouchableOpacity>
                      )}
                      contentContainerStyle={styles.matchesList}
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                );
              }}
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
                style={[
                  styles.sendButton,
                  !text.trim() && styles.disabledButton
                ]} 
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding.xl,
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
  disabledButton: {
    opacity: 0.5,
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
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius.round,
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadFriend: {
    backgroundColor: COLORS.card,
  },
  unreadFriendText: {
    color: COLORS.text.primary,
  },
  lastMessagePreview: {
    ...FONTS.caption,
    color: COLORS.text.light,
    marginTop: SIZES.padding.xs,
  },
  matchesContainer: {
    padding: SIZES.padding.md,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.sm,
  },
  matchesTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  matchesList: {
    paddingHorizontal: SIZES.padding.md,
  },
  matchedRestaurantItem: {
    padding: SIZES.padding.sm,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    marginRight: SIZES.padding.md,
    minWidth: 100,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  matchedRestaurantImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.padding.xs,
  },
  matchedRestaurantName: {
    ...FONTS.body,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  noFriendsContainer: {
    padding: SIZES.padding.md,
    alignItems: 'center',
  },
  noFriendsText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.md,
  },
  addFriendButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  addFriendButtonText: {
    ...FONTS.button,
    color: COLORS.text.inverse,
  },
  refreshButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  viewAllText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});