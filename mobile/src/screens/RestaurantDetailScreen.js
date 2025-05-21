import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  BackHandler
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import FullScreenImageViewer from '../components/FullScreenImageViewer';
import { useNotifications } from '../context/NotificationContext';

const { width, height } = Dimensions.get('window');

export default function RestaurantDetailScreen({ route, navigation }) {
  // Проверка наличия параметров route.params
  if (!route.params || !route.params.restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>Restaurant data is missing</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { restaurant: initialRestaurant, user } = route.params;
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [matchedFriends, setMatchedFriends] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showInviteFriendModal, setShowInviteFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const notificationContext = useNotifications();
  const showNotification = notificationContext?.showNotification || (() => {});
  
  useEffect(() => {
    console.log("Initial restaurant data:", JSON.stringify(initialRestaurant, null, 2));
    
    // Проверяем, есть ли у нас ID ресторана для загрузки деталей
    if (initialRestaurant && (initialRestaurant.place_id || initialRestaurant._id)) {
      fetchRestaurantDetails();
      checkIfLiked();
      
      // Проверяем друзей, которые лайкнули этот ресторан
      if (user && user._id) {
        fetchMatchedFriends();
      }
    } else {
      setLoading(false);
      setError("Invalid restaurant data");
    }
    
    // Добавляем обработчик аппаратной кнопки "назад" для Android
    const backHandler = Platform.OS === 'android' 
      ? BackHandler.addEventListener('hardwareBackPress', () => {
          console.log('Hardware back button pressed in RestaurantDetailScreen');
          navigation.goBack();
          return true; // Предотвращаем стандартное поведение
        })
      : null;
    
    // Очистка при размонтировании компонента
    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, []);
  
  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      
      const restaurantId = initialRestaurant.place_id || initialRestaurant._id;
      
      if (!restaurantId) {
        console.log('No restaurant ID found, using initial data');
        setRestaurant(initialRestaurant);
        setLoading(false);
        return;
      }
      
      // Создаем источник токена для отмены запроса
      const cancelTokenSource = axios.CancelToken.source();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout - cancelling');
        cancelTokenSource.cancel('Request took too long');
      }, 10000); // 10 секунд таймаут
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/restaurants/${restaurantId}` 
        : `http://192.168.0.82:5001/api/restaurants/${restaurantId}`;
      
      console.log('Fetching restaurant details from:', apiUrl);
      
      try {
        const response = await axios.get(apiUrl, {
          cancelToken: cancelTokenSource.token,
          timeout: 10000
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.name) {
          console.log('Restaurant details received:');
          console.log('Restaurant name:', response.data.name);
          console.log('Has photos:', !!response.data.photos);
          if (response.data.photos) {
            console.log('Number of photos:', response.data.photos.length);
            console.log('First photo URL:', response.data.photos[0]);
          }
          console.log('Has image:', !!response.data.image);
          if (response.data.image) {
            console.log('Image URL:', response.data.image);
          }
          
          // Убедимся, что все URL фотографий корректны
          let validatedPhotos = [];
          if (response.data.photos && Array.isArray(response.data.photos)) {
            validatedPhotos = response.data.photos.filter(photo => 
              typeof photo === 'string' && 
              (photo.startsWith('http://') || photo.startsWith('https://'))
            );
            console.log('Validated photos count:', validatedPhotos.length);
          }
          
          // Проверяем основное изображение
          let validatedImage = response.data.image;
          if (validatedImage && 
              typeof validatedImage === 'string' && 
              !(validatedImage.startsWith('http://') || validatedImage.startsWith('https://'))) {
            console.log('Invalid main image URL, clearing:', validatedImage);
            validatedImage = null;
          }
          
          // Объединяем полученные данные с начальными данными для заполнения пробелов
          const mergedData = {
            ...initialRestaurant,
            ...response.data,
            // Используем валидированные фотографии
            photos: validatedPhotos.length > 0 ? validatedPhotos : initialRestaurant.photos,
            image: validatedImage || initialRestaurant.image,
            // Убедимся, что ID сохраняется в обоих форматах
            _id: response.data._id || initialRestaurant._id || response.data.place_id || initialRestaurant.place_id,
            place_id: response.data.place_id || initialRestaurant.place_id || response.data._id || initialRestaurant._id
          };
          
          console.log('Merged restaurant data:');
          console.log('- Name:', mergedData.name);
          console.log('- Photos count:', mergedData.photos ? mergedData.photos.length : 0);
          console.log('- Has image:', !!mergedData.image);
          
          setRestaurant(mergedData);
          
          if (response.data.reviews) {
            setReviews(response.data.reviews);
          }
        } else {
          // Обработка пустого или некорректного ответа от сервера
          console.error('Invalid response data:', response.data);
          setError('Received invalid restaurant data from server');
          // Fall back to initial data if it has a name
          if (initialRestaurant && initialRestaurant.name) {
            console.log('Falling back to initial data');
            setRestaurant(initialRestaurant);
          } else {
            setError('Restaurant information is unavailable');
          }
        }
      } catch (axiosError) {
        if (axios.isCancel(axiosError)) {
          console.log('Request cancelled:', axiosError.message);
        } else {
          throw axiosError; // Проброс ошибки для обработки во внешнем catch
        }
      }
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details');
      // Fall back to initial data
      if (initialRestaurant && initialRestaurant.name) {
        setRestaurant(initialRestaurant);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getPhotoUrl = () => {
    let photoUrl;
    
    try {
      const validateUri = (uri) => {
        if (!uri) return false;
        
        // Проверка, что URI - строка
        if (typeof uri !== 'string') return false;
        
        // Базовая проверка на валидный URL
        return uri.startsWith('http://') || uri.startsWith('https://');
      };
      
      console.log('Getting photo URL for restaurant:', restaurant?.name);
      console.log('Photos array:', JSON.stringify(restaurant?.photos));
      console.log('Main image:', restaurant?.image);
      
      // Пытаемся получить фото из различных мест
      const firstPhoto = restaurant?.photos?.[0];
      
      // Проверяем, не является ли фото объектом с полем url или uri
      if (restaurant?.photos && restaurant.photos.length > 0) {
        let photoUri = null;
        
        if (currentPhotoIndex >= 0 && currentPhotoIndex < restaurant.photos.length) {
          const photo = restaurant.photos[currentPhotoIndex];
          
          // Проверяем, является ли фото объектом
          if (typeof photo === 'object' && photo !== null) {
            photoUri = photo.url || photo.uri || photo.source;
          } else {
            photoUri = photo; // Предполагаем, что это строка
          }
          
          console.log('Selected photo URI (raw):', photoUri);
          
          if (validateUri(photoUri)) {
            photoUrl = { uri: photoUri };
            console.log('Valid photo URI found');
          } else {
            console.log('Invalid photo URI, looking for alternatives');
            
            // Ищем валидное фото среди других фото
            let foundValidPhoto = false;
            for (let i = 0; i < restaurant.photos.length; i++) {
              const altPhoto = restaurant.photos[i];
              let altUri = null;
              
              if (typeof altPhoto === 'object' && altPhoto !== null) {
                altUri = altPhoto.url || altPhoto.uri || altPhoto.source;
              } else {
                altUri = altPhoto;
              }
              
              if (validateUri(altUri)) {
                photoUrl = { uri: altUri };
                console.log('Found alternative valid photo:', altUri);
                foundValidPhoto = true;
                break;
              }
            }
            
            if (!foundValidPhoto) {
              // Проверяем основное изображение
              if (validateUri(restaurant.image)) {
                photoUrl = { uri: restaurant.image };
                console.log('Using main image instead:', restaurant.image);
              } else {
                photoUrl = { uri: 'https://via.placeholder.com/400x300?text=No+Valid+Image' };
                console.log('No valid photos found, using placeholder');
              }
            }
          }
        } else {
          console.log('Photo index out of range, using fallback');
          if (validateUri(restaurant.image)) {
            photoUrl = { uri: restaurant.image };
            console.log('Using main image as fallback');
          } else if (restaurant.photos.length > 0) {
            // Ищем любое валидное фото
            let foundValidPhoto = false;
            for (let i = 0; i < restaurant.photos.length; i++) {
              const altPhoto = restaurant.photos[i];
              let altUri = null;
              
              if (typeof altPhoto === 'object' && altPhoto !== null) {
                altUri = altPhoto.url || altPhoto.uri || altPhoto.source;
              } else {
                altUri = altPhoto;
              }
              
              if (validateUri(altUri)) {
                photoUrl = { uri: altUri };
                console.log('Found valid photo at index', i, altUri);
                foundValidPhoto = true;
                break;
              }
            }
            
            if (!foundValidPhoto) {
              photoUrl = { uri: 'https://via.placeholder.com/400x300?text=No+Valid+Images' };
            }
          } else {
            photoUrl = { uri: 'https://via.placeholder.com/400x300?text=No+Images' };
          }
        }
      } else if (restaurant && restaurant.image) {
        // Проверяем, не является ли image объектом с полем url или uri
        let imageUri = null;
        
        if (typeof restaurant.image === 'object' && restaurant.image !== null) {
          imageUri = restaurant.image.url || restaurant.image.uri || restaurant.image.source;
        } else {
          imageUri = restaurant.image;
        }
        
        if (validateUri(imageUri)) {
          photoUrl = { uri: imageUri };
          console.log('Using main image (validated):', imageUri);
        } else {
          photoUrl = { uri: 'https://via.placeholder.com/400x300?text=Invalid+Image+URL' };
          console.log('Main image invalid, using placeholder');
        }
      } else {
        // Если нет фото, используем заполнитель
        photoUrl = { uri: 'https://via.placeholder.com/400x300?text=No+Image' };
        console.log('No images available, using placeholder');
      }
      
      console.log('Final photo URL:', JSON.stringify(photoUrl));
      return photoUrl;
    } catch (error) {
      console.error('Error getting photo URL:', error);
      // В случае ошибки, возвращаем заглушку
      return { uri: 'https://via.placeholder.com/400x300?text=Error+Loading+Image' };
    }
  };
  
  const nextPhoto = () => {
    if (restaurant.photos && restaurant.photos.length > 1) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === restaurant.photos.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const prevPhoto = () => {
    if (restaurant.photos && restaurant.photos.length > 1) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === 0 ? restaurant.photos.length - 1 : prevIndex - 1
      );
    }
  };
  
  const callRestaurant = () => {
    if (!restaurant.phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    Linking.openURL(`tel:${restaurant.phone}`).catch(err => {
      console.error('Error making call:', err);
      Alert.alert('Error', 'Could not make call');
    });
  };
  
  const getDirections = () => {
    const address = restaurant.address || restaurant.location;
    if (!address) {
      Alert.alert('Error', 'Address not available');
      return;
    }
    
    const query = typeof address === 'string' 
      ? address 
      : `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`
    });
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps');
    });
  };
  
  const visitWebsite = () => {
    if (!restaurant.website) {
      Alert.alert('Error', 'Website not available');
      return;
    }
    
    Linking.openURL(restaurant.website).catch(err => {
      console.error('Error opening website:', err);
      Alert.alert('Error', 'Could not open website');
    });
  };
  
  const makeReservation = () => {
    navigation.navigate('Reservation', { restaurant, user });
  };
  
  const formatHours = (hours) => {
    if (!hours) return 'Hours not available';
    
    if (typeof hours === 'string') return hours;
    
    if (Array.isArray(hours)) {
      // Check if hours are in the format with day objects
      if (hours.length > 0 && typeof hours[0] === 'object' && hours[0].day) {
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return daysOfWeek.map(day => {
          const dayHours = hours.find(h => h.day === day);
          if (dayHours) {
            return `${day}: ${dayHours.open} - ${dayHours.close}`;
          }
          return `${day}: Closed`;
        }).join('\n');
      }
      
      // If it's just an array of strings
      return hours.join('\n');
    }
    
    return 'Hours not available';
  };
  
  const checkIfLiked = async () => {
    if (user && user._id && restaurant) {
      try {
        const restaurantId = restaurant.place_id || restaurant._id;
        const apiUrl = Platform.OS === 'web' 
          ? `http://localhost:5001/api/users/${user._id}/likes/${restaurantId}` 
          : `http://192.168.0.82:5001/api/users/${user._id}/likes/${restaurantId}`;
          
        const res = await axios.get(apiUrl);
        setIsLiked(res.data.isLiked);
      } catch (e) {
        console.error('Error checking if restaurant is liked:', e);
        // If there's an error, assume it's not liked
        setIsLiked(false);
      }
    }
  };
  
  const toggleLike = async () => {
    if (!user || !user._id) {
      Alert.alert('Login Required', 'Please log in to save restaurants');
      return;
    }
    
    try {
      const restaurantId = restaurant.place_id || restaurant._id;
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/likes` 
        : `http://192.168.0.82:5001/api/users/${user._id}/likes`;
        
      if (isLiked) {
        // Unlike
        await axios.delete(`${apiUrl}/${restaurantId}`);
      } else {
        // Like
        await axios.post(apiUrl, { 
          restaurantId: restaurantId,
          restaurantName: restaurant.name,
          image: restaurant.image || (restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos[0] : null),
          cuisine: restaurant.cuisine,
          priceRange: restaurant.priceRange,
          rating: restaurant.rating,
          location: restaurant.address || restaurant.location
        });
      }
      
      setIsLiked(!isLiked);
    } catch (e) {
      console.error('Error toggling like status:', e);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };
  
  // Получить друзей, лайкнувших этот ресторан
  const fetchMatchedFriends = async () => {
    try {
      setLoadingMatches(true);
      console.log('Fetching matched friends for restaurant:', restaurant?.name);
      console.log('User:', user?._id);
      
      const restaurantId = restaurant?.place_id || restaurant?._id;
      if (!restaurantId) {
        console.error('No restaurant ID found');
        setLoadingMatches(false);
        return;
      }
      
      if (!user || !user._id) {
        console.error('No user data available');
        setLoadingMatches(false);
        return;
      }
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/matches/${user._id}/${restaurantId}` 
        : `http://192.168.0.82:5001/api/matches/${user._id}/${restaurantId}`;
      
      console.log('Fetching matches from URL:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('Matches response:', JSON.stringify(response.data));
      
      if (response.data && response.data.matches && response.data.matches.length > 0) {
        console.log('Found matches:', response.data.matches.length);
        
        // Получаем информацию о пользователях
        const friendsApiUrl = Platform.OS === 'web' 
          ? `http://localhost:5001/api/users/status` 
          : `http://192.168.0.82:5001/api/users/status`;
        
        console.log('Fetching friend statuses from:', friendsApiUrl);
        
        const friendsResponse = await axios.post(friendsApiUrl, { 
          userIds: response.data.matches 
        });
        
        console.log('Friend statuses received:', JSON.stringify(friendsResponse.data));
        
        // Объединяем информацию о пользователях со статусами
        const usersApiUrl = Platform.OS === 'web' 
          ? `http://localhost:5001/api/users/${user._id}/friends` 
          : `http://192.168.0.82:5001/api/users/${user._id}/friends`;
        
        console.log('Fetching friends from:', usersApiUrl);
        
        const usersResponse = await axios.get(usersApiUrl);
        console.log('Friends list received, count:', usersResponse.data?.length);
        
        // Формируем список друзей с их статусами
        const friendsWithStatus = response.data.matches.map(friendId => {
          const friendData = usersResponse.data?.find(u => u._id === friendId) || { 
            _id: friendId, 
            name: 'Unknown User', 
            username: 'unknown' 
          };
          
          const friendStatus = friendsResponse.data?.find(s => s.userId === friendId) || {
            isOnline: false,
            lastSwipedAt: null
          };
          
          console.log(`Friend: ${friendData.name}, isOnline: ${friendStatus.isOnline}`);
          
          return {
            ...friendData,
            ...friendStatus
          };
        });
        
        console.log('Final matched friends list:', JSON.stringify(friendsWithStatus));
        setMatchedFriends(friendsWithStatus);
        
        // Обновляем статус пользователя (есть совпадения)
        updateUserMatchStatus(true);
      } else {
        console.log('No matches found for this restaurant');
        setMatchedFriends([]);
        // Обновляем статус пользователя (нет совпадений)
        updateUserMatchStatus(false);
      }
    } catch (error) {
      console.error('Error fetching matched friends:', error);
      setMatchedFriends([]);
    } finally {
      setLoadingMatches(false);
    }
  };
  
  // Обновить статус пользователя (наличие совпадений)
  const updateUserMatchStatus = async (hasMatches) => {
    try {
      if (!user || !user._id) return;
      
      const statusApiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/status` 
        : `http://192.168.0.82:5001/api/users/${user._id}/status`;
        
      console.log(`Updating user match status: hasMatches=${hasMatches}`);
      await axios.put(statusApiUrl, { hasMatches });
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };
  
  const shareWithFriend = () => {
    // Переходим на экран друзей с параметрами для шеринга
    navigation.navigate('Friends', { 
      user,
      shareMode: true,
      shareData: {
        type: 'restaurant',
        restaurantId: restaurant.place_id || restaurant._id,
        restaurantName: restaurant.name,
        message: `Hi! Check out this restaurant: ${restaurant.name}. I think you'll like it!`
      }
    });
  };
  
  // Добавляем функцию загрузки списка друзей
  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${user._id}/friends` 
        : `http://192.168.0.82:5001/api/users/${user._id}/friends`;
      
      const response = await axios.get(apiUrl);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };
  
  // Добавляем функцию для открытия модального окна с выбором друга для приглашения
  const inviteFriend = () => {
    fetchFriends();
    setShowInviteFriendModal(true);
  };
  
  // Функция для приглашения выбранного друга
  const handleInviteFriend = (friend) => {
    setShowInviteFriendModal(false);
    navigation.navigate('Reservation', { 
      restaurant, 
      user, 
      inviteFriend: friend 
    });
  };

  // Компонент для отображения списка друзей в модальном окне
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => handleInviteFriend(item)}
    >
      <Image 
        source={{ 
          uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.username)}&background=4ecdc4&color=fff` 
        }} 
        style={styles.friendAvatar} 
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name || item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
    </TouchableOpacity>
  );
  
  // Обновляем интерфейс добавляя кнопки для приглашения друга
  const renderActionButtons = () => (
    <View style={styles.actionContainer}>
      <TouchableOpacity 
        style={styles.primaryActionButton}
        onPress={makeReservation}
      >
        <Ionicons name="calendar" size={24} color={COLORS.text.inverse} />
        <Text style={styles.primaryActionText}>Make a Reservation</Text>
      </TouchableOpacity>
      
      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={callRestaurant}>
          <View style={styles.buttonIconContainer}>
            <Ionicons name="call" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={getDirections}>
          <View style={styles.buttonIconContainer}>
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={visitWebsite}>
          <View style={styles.buttonIconContainer}>
            <Ionicons name="globe" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Website</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={inviteFriend}>
          <View style={styles.buttonIconContainer}>
            <Ionicons name="person-add" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Invite</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Добавляем модальное окно для выбора друга
  const renderInviteFriendModal = () => (
    <Modal
      visible={showInviteFriendModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowInviteFriendModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite a Friend</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowInviteFriendModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          {loadingFriends ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loading} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={40} color={COLORS.text.light} />
              <Text style={styles.emptyText}>You don't have any friends yet</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.friendsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurantDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.retryButton, { marginTop: 10, backgroundColor: COLORS.text.secondary }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Проверка на отсутствие данных ресторана после загрузки
  if (!restaurant || (!restaurant.name && !restaurant.place_id && !restaurant._id)) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>Restaurant data is incomplete or missing</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Restaurant Image */}
      <View style={styles.imageContainer}>
        {restaurant && (restaurant.photos && restaurant.photos.length > 0 || restaurant.image) ? (
          <>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setFullScreenVisible(true)}
            >
              {imageLoading && (
                <View style={styles.imageLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
              <Image 
                source={getPhotoUrl()} 
                style={styles.image}
                onLoadStart={() => {
                  console.log('Image load started');
                  setImageLoading(true);
                }}
                onLoadEnd={() => {
                  console.log('Image load ended');
                  setImageLoading(false);
                }}
                onError={(e) => {
                  console.error('Error loading image:', e.nativeEvent.error);
                  setImageLoading(false);
                  // При ошибке загрузки показываем заполнитель
                  Alert.alert('Image Error', 'Failed to load restaurant image. Using placeholder image instead.');
                }}
              />
            </TouchableOpacity>
            
            {restaurant.photos && restaurant.photos.length > 1 && (
              <>
                <TouchableOpacity style={styles.prevButton} onPress={prevPhoto}>
                  <Ionicons name="chevron-back" size={30} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.nextButton} onPress={nextPhoto}>
                  <Ionicons name="chevron-forward" size={30} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {currentPhotoIndex + 1}/{restaurant.photos.length}
                  </Text>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={60} color={COLORS.text.secondary} />
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('Back button pressed, navigating back');
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restaurant.name}</Text>
        
        <View style={styles.detailsRow}>
          {restaurant.cuisine && (
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{restaurant.cuisine}</Text>
            </View>
          )}
          
          {restaurant.priceRange && (
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{restaurant.priceRange}</Text>
            </View>
          )}
          
          {restaurant.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color={COLORS.warning} />
              <Text style={styles.rating}>{restaurant.rating}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
          <Text style={styles.address}>
            {typeof restaurant.address === 'string' 
              ? restaurant.address 
              : restaurant.address 
                ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}, ${restaurant.address.state || ''} ${restaurant.address.zipCode || ''}` 
                : restaurant.location || 'Address not available'}
          </Text>
        </View>
        
        {restaurant.hours && (
          <View style={styles.hoursContainer}>
            <Ionicons name="time-outline" size={20} color={COLORS.text.secondary} />
            <Text style={styles.hours}>{formatHours(restaurant.hours)}</Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={makeReservation}
          >
            <Ionicons name="calendar" size={24} color={COLORS.text.inverse} />
            <Text style={styles.primaryActionText}>Make a Reservation</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={callRestaurant}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name="call" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={getDirections}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name="navigate" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={visitWebsite}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name="globe" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={inviteFriend}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name="person-add" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Description */}
        {restaurant.description && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>About Restaurant</Text>
            <Text style={styles.description}>{restaurant.description}</Text>
          </View>
        )}
        
        {/* Matched Friends Section */}
        {user && user._id && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Friends Here</Text>
            {loadingMatches ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
            ) : matchedFriends.length > 0 ? (
              <View style={styles.matchedFriendsContainer}>
                {matchedFriends.map(friend => (
                  <View key={friend._id} style={styles.matchedFriendItem}>
                    <Image
                      source={{ uri: friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=4ecdc4&color=fff` }}
                      style={styles.friendAvatar}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendUsername}>@{friend.username}</Text>
                    </View>
                    <View style={[
                      styles.friendStatusBadge, 
                      { backgroundColor: friend.isOnline ? COLORS.success + '20' : COLORS.text.light + '20' }
                    ]}>
                      <View style={[
                        styles.friendStatusDot, 
                        { backgroundColor: friend.isOnline ? COLORS.success : COLORS.text.light }
                      ]} />
                      <Text style={[
                        styles.friendStatusText, 
                        { color: friend.isOnline ? COLORS.success : COLORS.text.light }
                      ]}>
                        {friend.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noMatchesContainer}>
                <Text style={styles.noMatchesText}>
                  None of your friends have liked this restaurant yet. Share with them!
                </Text>
                <TouchableOpacity 
                  style={styles.shareWithFriendsButton}
                  onPress={() => {
                    // Реализовать функцию отправки сообщения другу
                    navigation.navigate('Friends');
                  }}
                >
                  <Ionicons name="share-social-outline" size={20} color={COLORS.text.inverse} />
                  <Text style={styles.shareWithFriendsText}>Go to Friends</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.slice(0, 3).map((review, index) => (
              <View key={index} style={styles.reviewContainer}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author_name || "Anonymous"}</Text>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons 
                        key={i}
                        name={i < Math.round(review.rating) ? "star" : "star-outline"} 
                        size={16} 
                        color={COLORS.warning} 
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
                <Text style={styles.reviewDate}>{new Date(review.time * 1000).toLocaleDateString()}</Text>
              </View>
            ))}
            {reviews.length > 3 && (
              <TouchableOpacity style={styles.moreButton}>
                <Text style={styles.moreButtonText}>View all {reviews.length} reviews</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Menu Section */}
        {restaurant.menu && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Menu</Text>
            {restaurant.menu.map((category, index) => (
              <View key={index} style={styles.menuCategory}>
                <Text style={styles.menuCategoryTitle}>{category.category}</Text>
                {category.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.menuItem}>
                    <View style={styles.menuItemHeader}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
        
        {/* Map Section */}
        {restaurant.coordinates && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity 
              style={styles.mapPlaceholder}
              onPress={getDirections}
            >
              <Ionicons name="map-outline" size={60} color={COLORS.primary} />
              <Text style={styles.mapText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {restaurant.photos && restaurant.photos.length > 0 && (
        <FullScreenImageViewer
          visible={fullScreenVisible}
          imageUri={getPhotoUrl().uri}
          onClose={() => {
            console.log('Closing fullscreen image viewer');
            setFullScreenVisible(false);
          }}
        />
      )}
      
      {renderInviteFriendModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.4, // Increased height for better visibility
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  photoCounter: {
    position: 'absolute',
    bottom: SIZES.padding.md,
    right: SIZES.padding.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.lg,
  },
  photoCounterText: {
    color: '#fff',
    ...FONTS.caption,
    fontWeight: '600',
  },
  prevButton: {
    position: 'absolute',
    left: SIZES.padding.md,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
    zIndex: 2,
  },
  nextButton: {
    position: 'absolute',
    right: SIZES.padding.md,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
    zIndex: 2,
  },
  backButton: {
    position: 'absolute',
    top: SIZES.padding.lg,
    left: SIZES.padding.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 12,
    zIndex: 2,
  },
  infoContainer: {
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    marginTop: -SIZES.radius.xl,
    position: 'relative',
    zIndex: 1,
  },
  name: {
    ...FONTS.h1,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.md,
    fontSize: 28,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.lg,
    flexWrap: 'wrap',
  },
  tagContainer: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    borderRadius: SIZES.radius.lg,
    marginRight: SIZES.padding.sm,
    marginBottom: SIZES.padding.xs,
  },
  tagText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    borderRadius: SIZES.radius.lg,
    marginRight: SIZES.padding.sm,
  },
  rating: {
    ...FONTS.body,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.padding.md,
  },
  address: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.sm,
    flex: 1,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.padding.lg,
  },
  hours: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.sm,
    flex: 1,
  },
  actionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    marginBottom: SIZES.padding.lg,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding.md,
  },
  primaryActionText: {
    ...FONTS.h3,
    color: COLORS.text.inverse,
    marginLeft: SIZES.padding.sm,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    width: '23%',
    backgroundColor: COLORS.background,
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.lg,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding.xs,
  },
  actionText: {
    ...FONTS.caption,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    marginBottom: SIZES.padding.lg,
  },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.md,
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  reviewContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    marginBottom: SIZES.padding.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.sm,
  },
  reviewAuthor: {
    ...FONTS.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.sm,
    lineHeight: 20,
  },
  reviewDate: {
    ...FONTS.caption,
    color: COLORS.text.light,
    fontStyle: 'italic',
  },
  moreButton: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    alignItems: 'center',
  },
  moreButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuCategory: {
    marginBottom: SIZES.padding.lg,
  },
  menuCategoryTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
    fontSize: 18,
    fontWeight: '600',
  },
  menuItem: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    marginBottom: SIZES.padding.sm,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.xs,
  },
  menuItemName: {
    ...FONTS.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  menuItemPrice: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SIZES.padding.sm,
  },
  menuItemDescription: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  mapText: {
    ...FONTS.body,
    color: COLORS.primary,
    marginTop: SIZES.padding.sm,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...FONTS.h3,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SIZES.padding.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.md,
    borderRadius: SIZES.radius.lg,
  },
  retryButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  noImageText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginTop: SIZES.padding.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.padding.lg,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding.lg,
    paddingBottom: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SIZES.padding.xs,
  },
  friendsList: {
    paddingHorizontal: SIZES.padding.md,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SIZES.padding.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  friendUsername: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
  friendStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.xs,
    paddingVertical: SIZES.padding.xs / 2,
    borderRadius: SIZES.radius.sm,
  },
  friendStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SIZES.padding.xs,
  },
  friendStatusText: {
    ...FONTS.caption,
    color: COLORS.text.primary,
  },
  noMatchesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  noMatchesText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.md,
  },
  shareWithFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.lg,
    paddingVertical: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  shareWithFriendsText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
  },
  loading: {
    padding: SIZES.padding.xl,
  },
}); 