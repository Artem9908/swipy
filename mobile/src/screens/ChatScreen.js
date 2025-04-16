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
import { useNotifications } from '../context/NotificationContext';

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
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [suggestingDateTime, setSuggestingDateTime] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState(new Date());
  const [previousMessageCounts, setPreviousMessageCounts] = useState({});
  const flatListRef = useRef(null);
  const { showNotification } = useNotifications();

  useEffect(() => {
    console.log('Chat screen mounted, user:', user);
    console.log('Route params:', route.params);
    
    // Set active restaurant if this is a restaurant match chat
    if (shareData && (shareData.type === 'restaurant_match' || shareData.type === 'restaurant')) {
      setActiveRestaurant({
        id: shareData.restaurantId,
        name: shareData.restaurantName,
        image: shareData.restaurantImage
      });
    }
    
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

    // Добавляем обработчик потери фокуса
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('Chat screen lost focus');
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
        } 
        // Если friendId передан напрямую (например, из уведомления)
        else if (route.params && route.params.friendId) {
          console.log('FriendId detected in route params:', route.params.friendId);
          // Находим друга в загруженном списке
          const friendToSelect = friendsList.find(f => f._id === route.params.friendId);
          if (friendToSelect) {
            console.log('Friend found, setting as selected:', friendToSelect.name || friendToSelect.username);
            setSelectedFriend(friendToSelect);
          } else {
            console.log('Friend not found in the list, getting details');
            // Пытаемся получить данные о друге
            await fetchFriendDetails(route.params.friendId);
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
      unsubscribeBlur();
    };
  }, [navigation]);

  useEffect(() => {
    if (selectedFriend) {
      console.log('Selected friend changed to:', selectedFriend.name || selectedFriend.username);
      
      // Загрузка сообщений при выборе друга
      fetchMessages(false);
      
      // Send match announcement if this is a restaurant match chat
      if (shareData && shareData.type === 'restaurant_match') {
        // Wait for messages to load first
        setTimeout(() => {
          sendMatchAnnouncement();
        }, 500);
      }
      
      // Если есть данные для шеринга и выбран конкретный друг, отправляем сообщение автоматически
      if (shareData && (shareData.message || 
          shareData.type === 'tournament_winner' || 
          shareData.type === 'final_choice')) {
        console.log('Will send share message for restaurant:', shareData.restaurantName, 'Type:', shareData.type);
        // Немедленно отправляем сообщение
        setTimeout(() => {
          sendShareMessage();
        }, 800);
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

  // Send an automatic restaurant match announcement
  const sendMatchAnnouncement = async () => {
    if (!shareData || !selectedFriend || !user || !user._id || shareData.type !== 'restaurant_match') {
      return;
    }
    
    try {
      // Check if we've already sent an announcement for this restaurant
      const existingAnnouncement = messages.find(msg => 
        msg.isSystemMessage && 
        msg.restaurantId === shareData.restaurantId
      );
      
      if (existingAnnouncement) {
        console.log('Match announcement already exists for this restaurant');
        return;
      }
      
      console.log('Sending restaurant match announcement');
      
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/chat' 
        : 'http://192.168.0.82:5001/api/chat';
        
      const announcement = `🎉 You and ${selectedFriend.name || selectedFriend.username} both liked "${shareData.restaurantName}"!`;
      
      const response = await axios.post(apiUrl, {
        userId: 'system',  // Special ID for system messages
        recipientId: selectedFriend._id,
        text: announcement,
        timestamp: new Date().toISOString(),
        isSystemMessage: true,
        restaurantId: shareData.restaurantId
      });
      
      console.log('Match announcement sent successfully:', response.data);
      
      // Add announcement to messages
      setMessages(prevMessages => [...prevMessages, response.data]);
      
      // Scroll to the new message
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending match announcement:', error);
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
      console.log('Sending share message for restaurant:', shareData.restaurantName, 'Type:', shareData.type);
      
      // Формируем сообщение в зависимости от типа данных
      let message = '';
      
      if (shareData.message) {
        message = shareData.message;
      } else if (shareData.type === 'tournament_winner' || shareData.type === 'final_choice') {
        message = `I'd like to go to ${shareData.restaurantName}! Would you like to join me?`;
      } else {
        message = `Hi! Check out this restaurant: ${shareData.restaurantName}. I think you'll like it!`;
      }
      
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
      
      // Добавляем новое сообщение в список, не дожидаясь обновления
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

  // Функция для создания и сохранения уведомления
  const createMessageNotification = (message, friend) => {
    if (!user || !user._id || !friend) return;
    
    console.log('Creating notification for message:', message);
    console.log('From friend:', friend);
    
    // Создаем уведомление
    const notification = {
      id: Date.now().toString(),
      type: 'message',
      message: `Новое сообщение от ${friend.name || friend.username}`,
      createdAt: new Date().toISOString(),
      read: false,
      data: {
        friendId: friend._id,
        messageId: message._id || message.id
      }
    };
    
    // Показываем уведомление только если экран чата не активен
    if (!navigation.isFocused()) {
      console.log('Chat screen not focused, showing notification');
      showNotification(notification);
      
      // Сохраняем на сервере
      saveNotification(notification);
    } else {
      console.log('Chat screen is focused, not showing notification');
    }
  };
  
  // Сохранение уведомления на сервере
  const saveNotification = async (notification) => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/notifications' 
        : 'http://192.168.0.82:5001/api/notifications';
      
      const requestData = {
        userId: user._id,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        relatedUserId: notification.data.friendId
      };
      
      console.log('Saving notification to server:', requestData);
      
      const response = await axios.post(apiUrl, requestData);
      console.log('Notification saved, server response:', response.data);
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  // Заменяем функцию fetchMessages
  const fetchMessages = async (showLoading = true) => {
    if (!user || !user._id) {
      console.log('No user data in fetchMessages');
      setLoading(false);
      return;
    }
    
    if (showLoading) setLoading(true);
    
    try {
      if (selectedFriend) {
        // Запрашиваем сообщения для выбранного диалога
        const apiUrl = Platform.OS === 'web' 
          ? `http://localhost:5001/api/chat/${user._id}/${selectedFriend._id}` 
          : `http://192.168.0.82:5001/api/chat/${user._id}/${selectedFriend._id}`;
        
        console.log(`Fetching messages for chat with: ${selectedFriend.username || selectedFriend._id}`);
        
        const response = await axios.get(apiUrl);
        
        // Проверка на новые сообщения и отправка уведомлений
        const currentCount = response.data.length;
        const previousCount = previousMessageCounts[selectedFriend._id] || 0;
        
        // Если есть новые сообщения и это не первая загрузка чата
        if (currentCount > previousCount && previousCount > 0) {
          console.log(`Found new messages: previous=${previousCount}, current=${currentCount}`);
          
          // Находим новые сообщения, сравнивая массивы
          const existingIds = messages.map(msg => msg._id);
          const newMessages = response.data.filter(msg => !existingIds.includes(msg._id));
          
          console.log(`New messages count: ${newMessages.length}`);
          
          // Проверяем, есть ли сообщения от друга (не от текущего пользователя)
          const newFriendMessages = newMessages.filter(msg => 
            msg.userId === selectedFriend._id && !msg.isSystemMessage
          );
          
          console.log(`New friend messages count: ${newFriendMessages.length}`);
          
          // Если есть новые сообщения от друга и экран чата не в фокусе, показываем уведомление
          if (newFriendMessages.length > 0) {
            // Проверяем, имеет ли экран чата фокус в данный момент
            const isScreenFocused = navigation.isFocused();
            console.log('Is chat screen focused:', isScreenFocused);
            
            if (!isScreenFocused) {
              console.log('Chat screen not focused, creating notification');
              createMessageNotification(newFriendMessages[0], selectedFriend);
            } else {
              console.log('Chat screen is focused, not creating notification');
            }
          }
        }
        
        // Обновляем количество сообщений для этого друга
        setPreviousMessageCounts(prev => ({
          ...prev,
          [selectedFriend._id]: currentCount
        }));
        
        setMessages(response.data);
        
        // Когда сообщения загружены, прокручиваем к последнему
        setTimeout(() => {
          if (flatListRef.current && response.data.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 200);
      } else {
        // Если нет выбранного друга, загружаем список друзей с последними сообщениями
        console.log('No selected friend, loading friend list');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (showLoading) {
        setError('Could not load messages');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Function to send a date/time suggestion
  const sendDateTimeSuggestion = () => {
    if (!selectedFriend || !activeRestaurant) return;
    
    // Format the date nicely
    const formattedDate = suggestedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = suggestedDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Set the message text with the suggestion
    const suggestionMessage = `How about meeting at ${activeRestaurant.name} on ${formattedDate} at ${formattedTime}?`;
    setText(suggestionMessage);
    
    // Hide the date picker
    setSuggestingDateTime(false);
  };

  // Обновляем sendMessage для показа уведомлений
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
      
      // Отправляем сообщение на сервер
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
      
      // Добавляем сообщение в локальный список
      const newMessage = response.data;
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Очищаем поле ввода
      setText('');
      
      // Прокручиваем к последнему сообщению
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
      // Обновляем счетчик сообщений для этого друга
      setPreviousMessageCounts(prev => ({
        ...prev,
        [selectedFriend._id]: (prev[selectedFriend._id] || 0) + 1
      }));
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      return null;
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
            {activeRestaurant && (
              <View style={styles.activeRestaurantBanner}>
                <Image 
                  source={{ uri: activeRestaurant.image || 'https://via.placeholder.com/100?text=Restaurant' }}
                  style={styles.activeRestaurantImage} 
                />
                <View style={styles.activeRestaurantInfo}>
                  <Text style={styles.activeRestaurantTitle}>Discussing:</Text>
                  <Text style={styles.activeRestaurantName}>{activeRestaurant.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewRestaurantButton}
                  onPress={() => {
                    navigation.navigate('RestaurantDetail', {
                      restaurant: {
                        _id: activeRestaurant.id,
                        name: activeRestaurant.name,
                        image: activeRestaurant.image
                      },
                      user
                    });
                  }}
                >
                  <Text style={styles.viewRestaurantText}>View</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={({ item }) => (
                <View style={[
                  styles.messageItem,
                  item.userId === user._id ? styles.sentMessage : styles.receivedMessage,
                  item.isSystemMessage && styles.systemMessage
                ]}>
                  {item.userId !== user._id && !item.isSystemMessage && (
                    <Image 
                      source={{ uri: getAvatarUrl(selectedFriend.username) }} 
                      style={styles.messageAvatar} 
                    />
                  )}
                  <View style={[
                    styles.messageBubble,
                    item.userId === user._id ? styles.sentBubble : styles.receivedBubble,
                    item.isSystemMessage && styles.systemBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      item.userId === user._id ? styles.sentMessageText : styles.receivedMessageText,
                      item.isSystemMessage && styles.systemMessageText
                    ]}>
                      {item.text}
                    </Text>
                    {!item.isSystemMessage && (
                      <Text style={styles.timestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    )}
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
              {suggestingDateTime && activeRestaurant ? (
                <View style={styles.datePickerContainer}>
                  <Text style={styles.datePickerTitle}>Suggest a time to meet at {activeRestaurant.name}</Text>
                  
                  {/* Simple date picker - in a real app, use a proper date picker component */}
                  <View style={styles.datePickerRow}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const newDate = new Date(suggestedDate);
                        newDate.setDate(newDate.getDate() - 1);
                        setSuggestedDate(newDate);
                      }}
                    >
                      <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.dateText}>
                      {suggestedDate.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const newDate = new Date(suggestedDate);
                        newDate.setDate(newDate.getDate() + 1);
                        setSuggestedDate(newDate);
                      }}
                    >
                      <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.datePickerRow}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const newDate = new Date(suggestedDate);
                        newDate.setHours(newDate.getHours() - 1);
                        setSuggestedDate(newDate);
                      }}
                    >
                      <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.timeText}>
                      {suggestedDate.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const newDate = new Date(suggestedDate);
                        newDate.setHours(newDate.getHours() + 1);
                        setSuggestedDate(newDate);
                      }}
                    >
                      <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.datePickerActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setSuggestingDateTime(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={sendDateTimeSuggestion}
                    >
                      <Text style={styles.confirmButtonText}>Suggest This Time</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.text.light}
                    multiline
                  />
                  
                  {activeRestaurant && (
                    <TouchableOpacity 
                      style={styles.suggestTimeButton}
                      onPress={() => {
                        setSuggestedDate(new Date());
                        setSuggestingDateTime(true);
                      }}
                    >
                      <Ionicons name="calendar" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                  
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
                </>
              )}
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
    paddingBottom: SIZES.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
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
    marginTop: SIZES.padding.md,
  },
  friendsContainer: {
    marginBottom: SIZES.padding.md,
    paddingTop: SIZES.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 2,
  },
  friendsList: {
    paddingHorizontal: SIZES.padding.md,
    paddingBottom: SIZES.padding.md,
    paddingTop: 2,
  },
  friendItem: {
    padding: SIZES.padding.sm,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    marginRight: SIZES.padding.md,
    minWidth: 80,
    alignItems: 'center',
    ...SHADOWS.small,
    marginVertical: 6,
  },
  selectedFriend: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    transform: [{scale: 1.05}],
    ...SHADOWS.medium,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: SIZES.padding.sm,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  friendName: {
    ...FONTS.body,
    fontWeight: '500',
    color: COLORS.text.primary,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 2,
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
    borderTopWidth: 0,
    paddingTop: SIZES.padding.md,
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
  activeRestaurantBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    marginHorizontal: SIZES.padding.md,
    marginBottom: SIZES.padding.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  activeRestaurantImage: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.sm,
    marginRight: SIZES.padding.sm,
  },
  activeRestaurantInfo: {
    flex: 1,
  },
  activeRestaurantTitle: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  activeRestaurantName: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  viewRestaurantButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.xs,
    paddingHorizontal: SIZES.padding.sm,
    borderRadius: SIZES.radius.sm,
  },
  viewRestaurantText: {
    ...FONTS.caption,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
  systemMessage: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  systemBubble: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: SIZES.radius.md,
  },
  systemMessageText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  suggestTimeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding.xs,
    ...SHADOWS.small,
  },
  datePickerContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    ...SHADOWS.medium,
  },
  datePickerTitle: {
    ...FONTS.body,
    color: COLORS.text.primary,
    fontWeight: 'bold',
    marginBottom: SIZES.padding.sm,
    textAlign: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SIZES.padding.xs,
  },
  datePickerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  dateText: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  timeText: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding.md,
  },
  cancelButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelButtonText: {
    ...FONTS.body,
    color: COLORS.error,
  },
  confirmButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  confirmButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
});