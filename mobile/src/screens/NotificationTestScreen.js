import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';

const NotificationTestScreen = () => {
  const [userId, setUserId] = useState('');
  const [friendId, setFriendId] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTestNotification } = useNotifications();

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const { userId } = JSON.parse(userData);
        setUserId(userId);
        return userId;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  const sendTestNotification = async (type) => {
    try {
      setLoading(true);
      const currentUserId = userId || await getUserId();
      
      if (!currentUserId) {
        Alert.alert('Ошибка', 'Пользователь не авторизован');
        setLoading(false);
        return;
      }

      let endpoint = '';
      let payload = {};

      switch (type) {
        case 'match':
          if (!friendId) {
            Alert.alert('Ошибка', 'Введите ID друга');
            setLoading(false);
            return;
          }
          endpoint = `${API_URL}/api/notifications/test/match`;
          payload = { userId: currentUserId, friendId };
          break;
        
        case 'message':
          if (!friendId || !message) {
            Alert.alert('Ошибка', 'Введите ID друга и сообщение');
            setLoading(false);
            return;
          }
          endpoint = `${API_URL}/api/notifications/test/message`;
          payload = { userId: currentUserId, friendId, message };
          break;
        
        case 'invitation':
          if (!friendId || !restaurantId) {
            Alert.alert('Ошибка', 'Введите ID друга и ID ресторана');
            setLoading(false);
            return;
          }
          endpoint = `${API_URL}/api/notifications/test/invitation`;
          payload = { userId: currentUserId, friendId, restaurantId };
          break;
          
        default:
          Alert.alert('Ошибка', 'Неизвестный тип уведомления');
          setLoading(false);
          return;
      }

      const response = await axios.post(endpoint, payload);
      
      if (response.status === 200) {
        Alert.alert('Успех', `Тестовое уведомление типа "${type}" отправлено`);
        
        // Показываем локальное уведомление для тестирования
        const notificationTitle = type === 'match' 
          ? 'Новое совпадение!' 
          : type === 'message' 
            ? 'Новое сообщение' 
            : 'Приглашение в ресторан';
            
        const notificationBody = type === 'match'
          ? 'У вас новое совпадение с пользователем'
          : type === 'message'
            ? message
            : 'Вас приглашают в ресторан';
            
        addTestNotification(type, notificationBody);
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить уведомление');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Ошибка', `Не удалось отправить уведомление: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Тест уведомлений</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>ID пользователя (ваш):</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="Ваш ID"
          placeholderTextColor="#888"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>ID друга:</Text>
        <TextInput
          style={styles.input}
          value={friendId}
          onChangeText={setFriendId}
          placeholder="ID друга"
          placeholderTextColor="#888"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>ID ресторана:</Text>
        <TextInput
          style={styles.input}
          value={restaurantId}
          onChangeText={setRestaurantId}
          placeholder="ID ресторана"
          placeholderTextColor="#888"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Сообщение:</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Текст сообщения"
          placeholderTextColor="#888"
          multiline
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => sendTestNotification('match')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Тест Match</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => sendTestNotification('message')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Тест Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => sendTestNotification('invitation')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Тест Invitation</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <Text style={styles.loading}>Отправка...</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#FF9F1C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    width: '48%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
});

export default NotificationTestScreen; 