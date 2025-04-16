import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  Platform, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import { useNotifications } from '../context/NotificationContext';

export default function ReservationScreen({ route, navigation }) {
  const { user, restaurant, inviteFriend } = route.params || {};
  
  // Log received data
  console.log("Reservation screen received:", { user, restaurant, inviteFriend });
  
  const [restaurantId, setRestaurantId] = useState(restaurant ? restaurant._id : '');
  const [restaurantName, setRestaurantName] = useState(restaurant ? restaurant.name : '');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [partySize, setPartySize] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [status, setStatus] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showNotification } = useNotifications();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      // Use localhost for web or IP for devices
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/restaurants' 
        : 'http://192.168.0.82:5001/api/restaurants';
        
      console.log('Fetching restaurants from:', apiUrl);
      const res = await axios.get(apiUrl);
      
      if (res.data && Array.isArray(res.data)) {
        console.log(`Received ${res.data.length} restaurants`);
        setRestaurants(res.data);
      } else {
        console.log('No restaurants found');
        setRestaurants([]);
      }
    } catch (e) {
      console.error('Error fetching restaurants:', e);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantDetails = async () => {
    try {
      // Validate restaurant ID
      if (!restaurant || !restaurant._id) {
        setError('Invalid restaurant data');
        setLoading(false);
        return;
      }
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/restaurants/${restaurant._id}` 
        : `http://192.168.0.82:5001/api/restaurants/${restaurant._id}`;
        
      console.log('Fetching restaurant details from:', apiUrl);
      const res = await axios.get(apiUrl);
      
      if (!res.data) {
        setError('Restaurant details not found');
        setLoading(false);
        return;
      }
      
      setRestaurant(res.data);
      
      // After getting restaurant details, load reviews
      await fetchReviews(res.data._id);
    } catch (e) {
      console.error('Error fetching restaurant details:', e);
      setError('Failed to load restaurant details');
      setLoading(false);
    }
  };

  // Функция для создания уведомления о приглашении в ресторан
  const createInvitationNotification = async (friendId, reservationId) => {
    try {
      // Создаем уведомление
      const notification = {
        id: Date.now().toString(),
        type: 'invitation',
        message: `${user.name || user.username} пригласил тебя в ${restaurantName}. Посмотри?`,
        createdAt: new Date().toISOString(),
        read: false,
        data: {
          friendId: friendId,
          restaurantId: restaurantId,
          reservationId: reservationId
        }
      };
      
      // Сохраняем на сервере
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/notifications' 
        : 'http://192.168.0.82:5001/api/notifications';
      
      await axios.post(apiUrl, {
        userId: friendId,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        relatedUserId: user._id
      });
    } catch (error) {
      console.error('Error creating invitation notification:', error);
    }
  };

  const makeReservation = async () => {
    if (!restaurantId) {
      Alert.alert('Error', 'Please select a restaurant');
      return;
    }
    
    try {
      // Комбинируем дату и время
      const reservationDateTime = new Date(date);
      reservationDateTime.setHours(time.getHours());
      reservationDateTime.setMinutes(time.getMinutes());
      
      // Используем localhost для веб или IP для устройств
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/reservations' 
        : 'http://192.168.0.82:5001/api/reservations';
        
      const response = await axios.post(apiUrl, {
        userId: user._id,
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        dateTime: reservationDateTime.toISOString(),
        partySize: parseInt(partySize),
        specialRequests: specialRequests,
        status: 'pending'
      });
      
      // Если передан друг для приглашения, отправляем ему уведомление
      if (inviteFriend && inviteFriend._id) {
        await createInvitationNotification(inviteFriend._id, response.data._id);
        
        // Отправляем сообщение о приглашении через чат
        await sendInvitationMessage(inviteFriend._id, reservationDateTime);
      }
      
      Alert.alert(
        'Success',
        inviteFriend 
          ? `Your reservation has been created and ${inviteFriend.name || inviteFriend.username} has been invited!` 
          : 'Your reservation has been created successfully!',
        [
          {
            text: 'View My Reservations',
            onPress: () => navigation.navigate('Reservations')
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (e) {
      console.error('Reservation error:', e);
      Alert.alert('Error', 'Failed to create reservation. Please try again.');
    }
  };
  
  // Функция для отправки сообщения о приглашении через чат
  const sendInvitationMessage = async (friendId, reservationDateTime) => {
    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/chat' 
        : 'http://192.168.0.82:5001/api/chat';
      
      const formattedDate = formatDate(reservationDateTime);
      const formattedTime = formatTime(reservationDateTime);
      
      await axios.post(apiUrl, {
        userId: user._id,
        recipientId: friendId,
        text: `Привет! Я приглашаю тебя в ресторан "${restaurantName}" ${formattedDate} в ${formattedTime}. Присоединишься?`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending invitation message:', error);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Make a Reservation</Text>
          {restaurant && (
            <Text style={styles.subtitle}>at {restaurant.name}</Text>
          )}
        </View>

        {!restaurant && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Restaurant</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={restaurantId}
                style={styles.picker}
                onValueChange={(itemValue, itemIndex) => {
                  setRestaurantId(itemValue);
                  if (itemValue) {
                    const selected = restaurants.find(r => r._id === itemValue);
                    setRestaurantName(selected ? selected.name : '');
                  } else {
                    setRestaurantName('');
                  }
                }}
              >
                <Picker.Item label="Select a restaurant" value="" />
                {restaurants.map(restaurant => (
                  <Picker.Item 
                    key={restaurant._id} 
                    label={restaurant.name} 
                    value={restaurant._id} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
            <Ionicons name="calendar" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
            <Ionicons name="time" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={onTimeChange}
              minuteInterval={15}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Party Size</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={partySize}
              style={styles.picker}
              onValueChange={(itemValue) => setPartySize(itemValue)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(size => (
                <Picker.Item key={size} label={`${size} ${size === 1 ? 'person' : 'people'}`} value={size.toString()} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Special Requests</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Any special requests or notes for the restaurant"
            value={specialRequests}
            onChangeText={setSpecialRequests}
          />
        </View>

        <ActionButton
          title="Make Reservation"
          icon="calendar-check"
          onPress={makeReservation}
          type="primary"
          size="large"
          style={styles.reserveButton}
        />

        {status ? <Text style={styles.statusText}>{status}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.padding.md,
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
  header: {
    marginBottom: SIZES.padding.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  subtitle: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginTop: SIZES.padding.xs,
  },
  formGroup: {
    marginBottom: SIZES.padding.lg,
  },
  label: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    backgroundColor: COLORS.card,
  },
  dateTimeText: {
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    backgroundColor: COLORS.card,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  reserveButton: {
    marginTop: SIZES.padding.md,
  },
  statusText: {
    ...FONTS.body,
    textAlign: 'center',
    marginTop: SIZES.padding.md,
    color: COLORS.primary,
  },
});