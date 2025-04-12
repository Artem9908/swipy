const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Google Places API ключ
const GOOGLE_API_KEY = 'AIzaSyAt3PNU2oefv5rYg9GGr3koH1DfqxeJGqM'; // Замените на ваш ключ

// Моковые данные для пользователей и других сущностей
let users = [
  { username: 'artem2', password: 'yourpass', _id: '1', name: 'Artem' },
  { username: 'user2', password: 'pass2', _id: '2', name: 'User Two' },
  { username: 'user3', password: 'pass3', _id: '3', name: 'User Three' }
];

// Кэш для ресторанов
let restaurantsCache = {};
let restaurantDetailsCache = {};
let messages = [
  { 
    id: '1', 
    userId: '1', 
    recipientId: 'user1', 
    text: 'Hello there! How are you?', 
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  { 
    id: '2', 
    userId: 'user1', 
    recipientId: '1', 
    text: 'Hi! I\'m good, thanks for asking!', 
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    read: true
  },
  { 
    id: '3', 
    userId: '1', 
    recipientId: 'user1', 
    text: 'Have you tried that new Italian place downtown?', 
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    read: true
  },
  { 
    id: '4', 
    userId: 'system', 
    recipientId: '1', 
    text: '🎉 You and Alice both liked "Italiano Delizioso"!', 
    timestamp: new Date(Date.now() - 3300000).toISOString(),
    isSystemMessage: true,
    restaurantId: 'sample-restaurant-1'
  }
];
let reservations = [];
let likes = [];
let friends = [
  { userId: '1', friendId: '2' },
  { userId: '2', friendId: '1' }
];
let reviews = {};
let inviteCodes = [];
let userStatuses = {
  '1': { isOnline: true, lastSwipedAt: new Date().toISOString(), hasMatches: true },
  '2': { isOnline: false, lastSwipedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), hasMatches: false },
  '3': { isOnline: false, lastSwipedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), hasMatches: true }
};

// Array to store users' selected restaurants (final choices)
let selectedRestaurants = [];

// Array to store users' swipe history
let swipeHistory = [];

// Функция для генерации уникальных идентификаторов
function generateUniqueId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Маршруты API
app.post('/api/users/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  return res.json(user);
});

// Получение списка ресторанов с Google Places API
app.get('/api/restaurants', async (req, res) => {
  try {
    const { location = 'New York', cuisine, price, rating, radius = 5000, userId } = req.query;
    
    console.log('Запрос ресторанов с параметрами:', { location, cuisine, price, rating, radius });
    
    // Создаем ключ для кэша на основе параметров запроса
    const cacheKey = `${location}-${cuisine || 'all'}-${price || 'all'}-${rating || '0'}-${radius}`;
    
    // Проверяем, есть ли данные в кэше
    if (restaurantsCache[cacheKey]) {
      console.log('Возвращаем данные из кэша');
      return res.json(restaurantsCache[cacheKey]);
    }
    
    // Формируем запрос к Google Places API
    let googlePlacesUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    let query = `restaurants in ${location}`;
    
    if (cuisine && cuisine !== 'all') {
      query += ` ${cuisine}`;
    }
    
    const params = {
      query,
      type: 'restaurant',
      key: GOOGLE_API_KEY
    };
    
    if (radius) {
      params.radius = radius;
    }
    
    const response = await axios.get(googlePlacesUrl, { params });
    
    if (!response.data || !response.data.results || response.data.results.length === 0) {
      console.log('Google Places API вернул пустой результат');
      const fallbackRestaurants = generateRealRestaurants(location, cuisine, price, rating);
      restaurantsCache[cacheKey] = fallbackRestaurants;
      return res.json(fallbackRestaurants);
    }
    
    console.log(`Получено ${response.data.results.length} ресторанов от Google Places API`);
    
    // Преобразуем данные в формат, который ожидает наше приложение
    const restaurants = response.data.results.map(place => {
      // Определяем ценовую категорию
      let priceRange = '$';
      if (place.price_level) {
        priceRange = '$'.repeat(place.price_level);
      }
      
      // Фильтруем по цене, если указана
      if (price && price !== 'all' && place.price_level && place.price_level !== parseInt(price)) {
        return null;
      }
      
      // Фильтруем по рейтингу, если указан
      if (rating && place.rating && place.rating < parseFloat(rating)) {
        return null;
      }
      
      return {
        _id: place.place_id,
        name: place.name,
        cuisine: place.types.includes('restaurant') ? 
          (place.types.find(t => t !== 'restaurant' && t !== 'food' && t !== 'point_of_interest' && t !== 'establishment') || 'Restaurant').replace('_', ' ') : 
          'Restaurant',
        priceRange,
        rating: place.rating || 4.0,
        reviewCount: place.user_ratings_total || Math.floor(Math.random() * 500) + 50,
        location: location,
        address: place.formatted_address,
        phone: place.formatted_phone_number || '',
        url: place.website || '',
        image: place.photos && place.photos.length > 0 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : `https://source.unsplash.com/1600x900/?restaurant`,
        coordinates: { 
          latitude: place.geometry.location.lat, 
          longitude: place.geometry.location.lng 
        },
        hours: [
          { day: 'Monday', open: '11:00', close: '22:00' },
          { day: 'Tuesday', open: '11:00', close: '22:00' },
          { day: 'Wednesday', open: '11:00', close: '22:00' },
          { day: 'Thursday', open: '11:00', close: '23:00' },
          { day: 'Friday', open: '11:00', close: '23:00' },
          { day: 'Saturday', open: '10:00', close: '23:00' },
          { day: 'Sunday', open: '10:00', close: '22:00' }
        ],
        photos: place.photos && place.photos.length > 0 
          ? place.photos.slice(0, 3).map(photo => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
            )
          : [
              `https://source.unsplash.com/1600x900/?restaurant`,
              `https://source.unsplash.com/1600x900/?food`,
              `https://source.unsplash.com/1600x900/?dish`
            ]
      };
    }).filter(Boolean); // Удаляем null элементы после фильтрации
    
    // Сохраняем в кэш
    restaurantsCache[cacheKey] = restaurants;
    
    // Filter out swiped restaurants
    if (userId) {
      console.log(`Filtering restaurants for user: ${userId}`);
      
      // Get current time to check for expired swipes
      const now = new Date().toISOString();
      
      // Get all valid swipes for this user
      const userSwipes = swipeHistory.filter(
        swipe => swipe.userId === userId && swipe.expiresAt > now
      );
      
      // Get the list of restaurant IDs that have been swiped
      const swipedRestaurantIds = userSwipes.map(swipe => swipe.restaurantId);
      console.log(`Found ${swipedRestaurantIds.length} swiped restaurants`);
      
      // Get list of restaurants that are already liked by user
      const userLikes = likes.filter(like => like.userId === userId)
                             .map(like => like.restaurantId);
      console.log(`Found ${userLikes.length} liked restaurants for user ${userId}`);
      
      // Combine swiped and liked restaurant IDs
      const excludedRestaurantIds = [...new Set([...swipedRestaurantIds, ...userLikes])];
      console.log(`Total ${excludedRestaurantIds.length} restaurants to exclude for user ${userId}`);
      
      if (userLikes.length > 0) {
        console.log('Liked restaurant IDs to exclude:', userLikes);
      }
      
      // Filter out both swiped and liked restaurants
      const filteredRestaurants = restaurants.filter(restaurant => {
        const restId = restaurant._id || restaurant.place_id;
        const shouldShow = !excludedRestaurantIds.includes(restId);
        if (!shouldShow && userLikes.includes(restId)) {
          console.log(`Excluding restaurant ${restaurant.name} because it's in favorites`);
        }
        return shouldShow;
      });
      
      // Randomize the order of restaurants
      const randomizedRestaurants = filteredRestaurants.sort(() => 0.5 - Math.random());
      
      console.log(`Returning ${randomizedRestaurants.length} restaurants after filtering out ${restaurants.length - randomizedRestaurants.length} restaurants`);
      
      return res.json(randomizedRestaurants);
    }
    
    return res.json(restaurants);
    
  } catch (error) {
    console.error('Error fetching restaurants from Google Places API:', error.message);
    
    // В случае ошибки возвращаем моковые данные
    console.log('Ошибка, генерируем моковые данные');
    const fallbackRestaurants = generateRealRestaurants('New York', null, null, null);
    return res.json(fallbackRestaurants);
  }
});

// Получение деталей ресторана
app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Запрос деталей ресторана с ID: ${id}`);
    
    // Проверяем кэш
    if (restaurantDetailsCache[id]) {
      console.log(`Возвращаем детали ресторана из кэша: ${restaurantDetailsCache[id].name}`);
      return res.json(restaurantDetailsCache[id]);
    }
    
    // Ищем ресторан во всех кэшированных данных
    let restaurant = null;
    
    // Проходим по всем кэшированным результатам
    Object.values(restaurantsCache).forEach(restaurants => {
      const found = restaurants.find(r => r._id === id);
      if (found) restaurant = found;
    });
    
    // Если ресторан не найден в кэше, запрашиваем детали из Google Places API
    if (!restaurant) {
      console.log('Ресторан не найден в кэше, запрашиваем из Google Places API');
      
      const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
      const params = {
        place_id: id,
        fields: 'name,rating,formatted_phone_number,formatted_address,geometry,opening_hours,photos,price_level,reviews,types,website,user_ratings_total',
        key: GOOGLE_API_KEY
      };
      
      const response = await axios.get(detailsUrl, { params });
      
      if (!response.data || !response.data.result) {
        console.log(`Ресторан с ID ${id} не найден в Google Places API`);
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      const place = response.data.result;
      
      // Преобразуем данные в формат, который ожидает наше приложение
      restaurant = {
        _id: place.place_id,
        name: place.name,
        cuisine: place.types.includes('restaurant') ? 
          (place.types.find(t => t !== 'restaurant' && t !== 'food' && t !== 'point_of_interest' && t !== 'establishment') || 'Restaurant').replace('_', ' ') : 
          'Restaurant',
        priceRange: place.price_level ? '$'.repeat(place.price_level) : '$$',
        rating: place.rating || 4.0,
        reviewCount: place.user_ratings_total || Math.floor(Math.random() * 500) + 50,
        location: place.formatted_address.split(',').slice(-2)[0].trim(),
        address: place.formatted_address,
        phone: place.formatted_phone_number || '',
        url: place.website || '',
        // Максимальное качество для основного изображения
        image: place.photos && place.photos.length > 0 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : `https://source.unsplash.com/1600x900/?restaurant,food`,
        coordinates: place.geometry ? {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        } : null
      };
    }
    
    // Добавляем дополнительные данные для детального просмотра
    if (!restaurant.description) {
      restaurant.description = `${restaurant.name} is a popular ${restaurant.cuisine} restaurant located in ${restaurant.location}. Known for its exceptional service and delicious food, it's a favorite among locals and tourists alike.`;
    }
    
    // Добавляем часы работы, если их нет
    if (!restaurant.hours) {
      restaurant.hours = [
        { day: 'Monday', open: '11:00', close: '22:00' },
        { day: 'Tuesday', open: '11:00', close: '22:00' },
        { day: 'Wednesday', open: '11:00', close: '22:00' },
        { day: 'Thursday', open: '11:00', close: '23:00' },
        { day: 'Friday', open: '11:00', close: '23:00' },
        { day: 'Saturday', open: '10:00', close: '23:00' },
        { day: 'Sunday', open: '10:00', close: '22:00' }
      ];
    }
    
    // Добавляем меню, если его нет
    if (!restaurant.menu) {
      restaurant.menu = [
        { 
          category: 'Appetizers', 
          items: [
            { name: `${restaurant.cuisine} Starter Platter`, price: 12.99, description: 'A selection of traditional appetizers' },
            { name: 'House Salad', price: 8.99, description: 'Fresh greens with house dressing' },
            { name: 'Soup of the Day', price: 7.99, description: 'Ask your server for today\'s selection' }
          ]
        },
        { 
          category: 'Main Courses', 
          items: [
            { name: `${restaurant.cuisine} Specialty Dish`, price: 24.99, description: 'Our chef\'s signature creation' },
            { name: 'Grilled Salmon', price: 22.99, description: 'Fresh salmon with seasonal vegetables' },
            { name: 'Vegetarian Option', price: 18.99, description: 'Seasonal vegetables and grains' }
          ]
        },
        { 
          category: 'Desserts', 
          items: [
            { name: 'Chocolate Cake', price: 8.99, description: 'Rich chocolate cake with vanilla ice cream' },
            { name: 'Cheesecake', price: 7.99, description: 'New York style cheesecake' },
            { name: 'Fruit Platter', price: 6.99, description: 'Selection of seasonal fruits' }
          ]
        }
      ];
    }
    
    // Добавляем фотографии высокого качества
    // Используем комбинацию Google Places API и Unsplash для гарантированного получения хороших фото
    if (!restaurant.photos || restaurant.photos.length < 5) {
      // Получаем фото из Google Places API, если они есть
      const googlePhotos = [];
      
      // Если у нас есть доступ к API и есть фотографии
      if (GOOGLE_API_KEY && restaurant._id.startsWith('ChI')) {
        try {
          const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
          const params = {
            place_id: restaurant._id,
            fields: 'photos',
            key: GOOGLE_API_KEY
          };
          
          const response = await axios.get(detailsUrl, { params });
          
          if (response.data && response.data.result && response.data.result.photos) {
            // Берем до 5 фотографий с максимальным качеством
            googlePhotos.push(...response.data.result.photos.slice(0, 5).map(photo => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&maxheight=1500&photoreference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
            ));
          }
        } catch (error) {
          console.error('Error fetching additional photos:', error.message);
        }
      }
      
      // Дополняем фотографиями из Unsplash, если не хватает
      const unsplashPhotos = [
        `https://source.unsplash.com/1600x900/?${encodeURIComponent(restaurant.cuisine + ' food')}`,
        `https://source.unsplash.com/1600x900/?${encodeURIComponent(restaurant.cuisine + ' restaurant')}`,
        `https://source.unsplash.com/1600x900/?${encodeURIComponent(restaurant.cuisine + ' dish')}`,
        `https://source.unsplash.com/1600x900/?${encodeURIComponent('gourmet ' + restaurant.cuisine)}`,
        `https://source.unsplash.com/1600x900/?${encodeURIComponent('restaurant interior')}`
      ];
      
      // Комбинируем фотографии из обоих источников
      restaurant.photos = [...googlePhotos];
      
      // Добавляем фото из Unsplash, если не хватает
      let i = 0;
      while (restaurant.photos.length < 5 && i < unsplashPhotos.length) {
        restaurant.photos.push(unsplashPhotos[i]);
        i++;
      }
    }
    
    // Сохраняем в кэш
    restaurantDetailsCache[id] = restaurant;
    
    console.log(`Возвращаем детали ресторана: ${restaurant.name}`);
    return res.json(restaurant);
    
  } catch (error) {
    console.error('Error fetching restaurant details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

// Функция для генерации моковых данных (на случай ошибок с API)
function generateRealRestaurants(location, cuisine, price, rating) {
  // Реальные названия ресторанов по кухням
  const restaurantsByType = {
    Italian: [
      { name: "Carbone", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Rao's", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Il Mulino", image: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Marea", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Babbo", image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Lilia", image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Japanese: [
      { name: "Nobu", image: "https://images.unsplash.com/photo-1553621042-f6e147245754?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Morimoto", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Masa", image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Sushi Nakazawa", image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Ippudo", image: "https://images.unsplash.com/photo-1584278858536-52532423b9ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Chinese: [
      { name: "Hakkasan", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Mr. Chow", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Jing Fong", image: "https://images.unsplash.com/photo-1541696490-8744a5dc0228?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Xi'an Famous Foods", image: "https://images.unsplash.com/photo-1623341214825-9f4f963727da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Nom Wah Tea Parlor", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Mexican: [
      { name: "Cosme", image: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Empellón", image: "https://images.unsplash.com/photo-1464219222984-216ebffaaf85?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Tacombi", image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Casa Enrique", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Los Tacos No.1", image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    American: [
      { name: "Eleven Madison Park", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Peter Luger", image: "https://images.unsplash.com/photo-1558030006-450675393462?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Gramercy Tavern", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "The Spotted Pig", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Shake Shack", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Indian: [
      { name: "Junoon", image: "https://images.unsplash.com/photo-1585937421612-70a008356c36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Adda", image: "https://images.unsplash.com/photo-1542367592-8849eb7cbdd6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Tamarind", image: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Dawat", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Dhamaka", image: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Thai: [
      { name: "Somtum Der", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Uncle Boons", image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Fish Cheeks", image: "https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Soothr", image: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Thai Villa", image: "https://images.unsplash.com/photo-1580212206172-3a5c0fca294a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Mediterranean: [
      { name: "Ilili", image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Milos", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Taboon", image: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Olea", image: "https://images.unsplash.com/photo-1530554764233-e79e16c91d08?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Shuka", image: "https://images.unsplash.com/photo-1540914124281-342587941389?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    French: [
      { name: "Le Bernardin", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Daniel", image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Jean-Georges", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Balthazar", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Café Boulud", image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ],
    Korean: [
      { name: "Cote", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Jungsik", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Atomix", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Danji", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" },
      { name: "Kang Ho Dong Baekjeong", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" }
    ]
  };
  
  const cuisines = Object.keys(restaurantsByType);
  const priceRanges = ['$', '$$', '$$$', '$$$$'];
  const locations = {
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'Miami': { lat: 25.7617, lng: -80.1918 }
  };
  
  const restaurants = [];
  
  // Если указана конкретная кухня, используем только её
  const cuisinesToUse = cuisine && cuisine !== 'all' ? [cuisine] : cuisines;
  
  // Для каждой кухни добавляем рестораны
  cuisinesToUse.forEach(cuisineType => {
    if (!restaurantsByType[cuisineType]) return;
    
    restaurantsByType[cuisineType].forEach((restaurant, index) => {
      const randomPriceRange = price && price !== 'all' ? '$'.repeat(parseInt(price)) : priceRanges[Math.floor(Math.random() * priceRanges.length)];
      const randomRating = (Math.random() * 2 + 3).toFixed(1);
      
      // Применяем фильтр по рейтингу, если указан
      if (rating && parseFloat(randomRating) < parseFloat(rating)) {
        return;
      }
      
      // Координаты на основе локации с небольшим смещением
      const baseCoords = locations[location] || locations['New York'];
      const latitude = baseCoords.lat + (Math.random() * 0.1 - 0.05);
      const longitude = baseCoords.lng + (Math.random() * 0.1 - 0.05);
      
      restaurants.push({
        _id: `r${cuisineType}-${index}`,
        name: restaurant.name,
        cuisine: cuisineType,
        priceRange: randomPriceRange,
        rating: parseFloat(randomRating),
        reviewCount: Math.floor(Math.random() * 500) + 50,
        location: location,
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Broadway', 'Park', 'Fifth', 'Madison', 'Lexington'][Math.floor(Math.random() * 6)]} ${['St', 'Ave', 'Blvd', 'Rd'][Math.floor(Math.random() * 4)]}, ${location}`,
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        url: 'https://example.com/restaurant',
        image: restaurant.image,
        coordinates: { 
          latitude: latitude, 
          longitude: longitude 
        },
        hours: [
          { day: 'Monday', open: '11:00', close: '22:00' },
          { day: 'Tuesday', open: '11:00', close: '22:00' },
          { day: 'Wednesday', open: '11:00', close: '22:00' },
          { day: 'Thursday', open: '11:00', close: '23:00' },
          { day: 'Friday', open: '11:00', close: '23:00' },
          { day: 'Saturday', open: '10:00', close: '23:00' },
          { day: 'Sunday', open: '10:00', close: '22:00' }
        ],
        photos: [
          restaurant.image,
          `https://source.unsplash.com/800x600/?food,${cuisineType.toLowerCase()}`,
          `https://source.unsplash.com/800x600/?dish,${cuisineType.toLowerCase()}`
        ]
      });
    });
  });
  
  return restaurants;
}

// Остальные эндпоинты
app.get('/api/likes/:userId', (req, res) => {
  const { userId } = req.params;
  const userLikes = likes.filter(like => like.userId === userId);
  return res.json(userLikes);
});

app.post('/api/likes', (req, res) => {
  const { userId, restaurantId } = req.body;
  
  // Проверяем, существует ли уже такой лайк
  const existingLike = likes.find(like => like.userId === userId && like.restaurantId === restaurantId);
  
  if (existingLike) {
    return res.status(400).json({ error: 'Like already exists' });
  }
  
  // Добавляем лайк
  const newLike = {
    id: `like-${Date.now()}`,
    userId,
    restaurantId,
    timestamp: new Date().toISOString()
  };
  
  likes.push(newLike);
  
  return res.json(newLike);
});

app.get('/api/matches/:userId/:restaurantId', (req, res) => {
  const { userId, restaurantId } = req.params;
  
  // Получаем друзей пользователя
  const userFriends = friends
    .filter(f => f.userId === userId)
    .map(f => f.friendId);
  
  // Получаем лайки друзей для данного ресторана
  const friendLikes = likes.filter(like => 
    userFriends.includes(like.userId) && like.restaurantId === restaurantId
  );
  
  // Получаем уникальных друзей, которые лайкнули ресторан
  const matchedFriends = [...new Set(friendLikes.map(like => like.userId))];
  
  return res.json({ matches: matchedFriends });
});

app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Получаем ID друзей пользователя
  const friendIds = friends
    .filter(f => f.userId === userId)
    .map(f => f.friendId);
  
  // Получаем данные друзей
  const userFriends = users.filter(user => friendIds.includes(user._id));
  
  return res.json(userFriends);
});

app.post('/api/friends', (req, res) => {
  const { userId, friendId } = req.body;
  console.log('Adding friend:', { userId, friendId });
  
  // Проверяем, существуют ли пользователи
  const user = users.find(u => u._id === userId);
  const friend = users.find(u => u._id === friendId);
  
  if (!user || !friend) {
    console.log('User or friend not found:', { user, friend });
    return res.status(404).json({ error: 'User or friend not found' });
  }
  
  // Проверяем, существует ли уже такая дружба
  const existingFriendship = friends.find(f => 
    (f.userId === userId && f.friendId === friendId) ||
    (f.userId === friendId && f.friendId === userId)
  );
  
  if (existingFriendship) {
    console.log('Friendship already exists');
    return res.status(400).json({ error: 'Friendship already exists' });
  }
  
  // Добавляем дружбу (в обе стороны)
  const friendship1 = {
    id: `f1-${Date.now()}`,
    userId,
    friendId,
    timestamp: new Date().toISOString()
  };
  
  const friendship2 = {
    id: `f2-${Date.now()}`,
    userId: friendId,
    friendId: userId,
    timestamp: new Date().toISOString()
  };
  
  friends.push(friendship1, friendship2);
  console.log('Friendship created:', { friendship1, friendship2 });
  console.log('Updated friends array:', friends);
  
  return res.json(friendship1);
});

app.delete('/api/friends/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  console.log('Removing friend:', { userId, friendId });
  
  // Удаляем дружбу в обе стороны
  const initialLength = friends.length;
  friends = friends.filter(f => 
    !((f.userId === userId && f.friendId === friendId) || 
      (f.userId === friendId && f.friendId === userId))
  );
  
  const removed = initialLength - friends.length;
  console.log(`Removed ${removed} friendship records`);
  console.log('Updated friends array:', friends);
  
  return res.json({ success: true, removed });
});

app.get('/api/chat/:userId/:recipientId', (req, res) => {
  const { userId, recipientId } = req.params;
  
  // Получаем сообщения между пользователями
  const chatMessages = messages.filter(msg => 
    (msg.userId === userId && msg.recipientId === recipientId) ||
    (msg.userId === recipientId && msg.recipientId === userId)
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return res.json(chatMessages);
});

app.post('/api/chat', (req, res) => {
  const { userId, recipientId, text, timestamp, isSystemMessage, restaurantId } = req.body;
  console.log(`Sending message from ${userId} to ${recipientId}`);
  
  if (!userId || !recipientId || !text) {
    console.log('Missing required fields in message request');
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Проверяем существование пользователей (кроме системных сообщений)
  if (userId !== 'system') {
    const user = users.find(u => u._id === userId);
    if (!user) {
      console.log(`Sender with ID ${userId} not found`);
      return res.status(404).json({ error: 'Sender not found' });
    }
  }
  
  if (recipientId !== 'system') {
    const recipient = users.find(u => u._id === recipientId);
    if (!recipient) {
      console.log(`Recipient with ID ${recipientId} not found`);
      return res.status(404).json({ error: 'Recipient not found' });
    }
  }
  
  // Generate a new unique ID
  const id = generateUniqueId();
  
  // Create the new message object
  const newMessage = {
    id,
    userId,
    recipientId,
    text,
    timestamp: timestamp || new Date().toISOString(),
    read: userId === 'system', // System messages are automatically read
  };

  // Add optional fields if they exist
  if (isSystemMessage) newMessage.isSystemMessage = true;
  if (restaurantId) newMessage.restaurantId = restaurantId;
  
  // Add to the messages array
  messages.push(newMessage);
  console.log(`Message saved, ID: ${newMessage.id}`);
  
  // Update hasMatches status for users if this is a restaurant match
  if (isSystemMessage && text.includes('both liked') && recipientId) {
    const userIds = [userId, recipientId].filter(id => id !== 'system');
    
    userIds.forEach(id => {
      if (userStatuses[id]) {
        userStatuses[id].hasMatches = true;
      }
    });
  }
  
  return res.status(201).json(newMessage);
});

// Работа с бронированиями
app.get('/api/reservations/:userId', (req, res) => {
  const { userId } = req.params;
  
  const userReservations = reservations
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  
  return res.json(userReservations);
});

app.post('/api/reservations', (req, res) => {
  const { userId, restaurantId, restaurantName, dateTime, partySize, specialRequests, status } = req.body;
  
  // Проверяем, существует ли пользователь
  const user = users.find(u => u._id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Добавляем бронирование
  const newReservation = {
    id: `res-${Date.now()}`,
    userId,
    restaurantId,
    restaurantName,
    dateTime,
    partySize,
    specialRequests,
    status: status || 'pending',
    createdAt: new Date().toISOString()
  };
  
  reservations.push(newReservation);
  
  return res.json(newReservation);
});

// Get all users
app.get('/api/users', (req, res) => {
  // Return all users except their passwords for security
  const safeUsers = users.map(user => {
    // Create a user object with name field derived from username
    return {
      _id: user._id,
      username: user.username,
      name: user.username, // Using username as name since we don't have names
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4ecdc4&color=fff`
    };
  });
  
  return res.json(safeUsers);
});

// Get user's friends
app.get('/api/users/:userId/friends', (req, res) => {
  const { userId } = req.params;
  
  // Get friend IDs from the friends array
  const friendIds = friends
    .filter(f => f.userId === userId)
    .map(f => f.friendId);
  
  // Get the actual user objects for these friends
  const userFriends = users
    .filter(user => friendIds.includes(user._id))
    .map(user => ({
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4ecdc4&color=fff`
    }));
  
  return res.json(userFriends);
});

// Get user's liked restaurants
app.get('/api/users/:userId/likes', (req, res) => {
  const { userId } = req.params;
  
  console.log(`GET request for user ${userId}'s likes`);
  console.log(`Total likes in database: ${likes.length}`);
  
  // Find all likes for this user
  const userLikes = likes.filter(like => like.userId === userId);
  
  console.log(`Found ${userLikes.length} likes for user ${userId}`);
  console.log('Sample like entry:', userLikes.length > 0 ? JSON.stringify(userLikes[0]) : 'None');
  
  return res.json(userLikes);
});

// Check if a restaurant is liked by a user
app.get('/api/users/:userId/likes/:restaurantId', (req, res) => {
  const { userId, restaurantId } = req.params;
  
  // Check if this restaurant is liked by the user
  const isLiked = likes.some(like => 
    like.userId === userId && like.restaurantId === restaurantId
  );
  
  return res.json({ isLiked });
});

// Add a restaurant to likes
app.post('/api/users/:userId/likes', (req, res) => {
  const { userId } = req.params;
  const { 
    restaurantId, 
    restaurantName, 
    image, 
    cuisine, 
    priceRange, 
    rating, 
    location 
  } = req.body;
  
  console.log(`Adding restaurant to likes - userId: ${userId}, restaurantId: ${restaurantId}, name: ${restaurantName}`);
  
  // Check if already liked
  const existingLike = likes.find(like => 
    like.userId === userId && like.restaurantId === restaurantId
  );
  
  if (existingLike) {
    console.log(`Restaurant ${restaurantId} already in likes for user ${userId}`);
    return res.json(existingLike);
  }
  
  // Add new like
  const newLike = {
    userId,
    restaurantId,
    restaurantName,
    image,
    cuisine,
    priceRange,
    rating,
    location,
    timestamp: new Date().toISOString()
  };
  
  likes.push(newLike);
  console.log(`Successfully added restaurant ${restaurantId} (${restaurantName}) to user ${userId}'s likes`);
  console.log(`User now has ${likes.filter(like => like.userId === userId).length} liked restaurants`);
  
  return res.json(newLike);
});

// Diagnostic endpoint to check all likes data
app.get('/api/diagnostic/likes', (req, res) => {
  const likesInfo = {
    totalLikes: likes.length,
    likesByUser: {},
    potentialIssues: []
  };
  
  // Group likes by user
  likes.forEach(like => {
    if (!likesInfo.likesByUser[like.userId]) {
      likesInfo.likesByUser[like.userId] = [];
    }
    likesInfo.likesByUser[like.userId].push({
      restaurantId: like.restaurantId,
      restaurantName: like.restaurantName,
      timestamp: like.timestamp
    });
  });
  
  // Check for potential issues (duplicates, missing fields)
  const userIds = Object.keys(likesInfo.likesByUser);
  userIds.forEach(userId => {
    const userLikes = likesInfo.likesByUser[userId];
    
    // Check for duplicate restaurantIds
    const restaurantIds = userLikes.map(like => like.restaurantId);
    const uniqueRestaurantIds = [...new Set(restaurantIds)];
    
    if (restaurantIds.length !== uniqueRestaurantIds.length) {
      likesInfo.potentialIssues.push(`User ${userId} has duplicate restaurant IDs in likes`);
    }
    
    // Check for missing restaurantIds
    const missingIds = userLikes.filter(like => !like.restaurantId);
    if (missingIds.length > 0) {
      likesInfo.potentialIssues.push(`User ${userId} has ${missingIds.length} likes with missing restaurantId`);
    }
  });
  
  return res.json(likesInfo);
});

// Remove a restaurant from likes
app.delete('/api/users/:userId/likes/:restaurantId', (req, res) => {
  const { userId, restaurantId } = req.params;
  
  console.log(`DELETE request received - Removing restaurant ${restaurantId} from user ${userId}'s likes`);
  console.log(`Current likes count: ${likes.length}`);
  console.log(`All likes before deletion:`, JSON.stringify(likes));
  
  // Find the index of the like to remove
  const likeIndex = likes.findIndex(like => 
    like.userId === userId && like.restaurantId === restaurantId
  );
  
  console.log(`Found like at index: ${likeIndex}`);
  
  if (likeIndex === -1) {
    console.log(`Like not found for userId: ${userId}, restaurantId: ${restaurantId}`);
    console.log(`All existing like IDs:`, likes.map(like => like.restaurantId).join(', '));
    return res.status(404).json({ error: 'Like not found' });
  }
  
  // Remove the like
  const removedLike = likes.splice(likeIndex, 1)[0];
  console.log(`Removed like for restaurant: ${removedLike.restaurantName || 'unknown'}`);
  console.log(`New likes count: ${likes.length}`);
  
  return res.json({ 
    success: true, 
    message: 'Restaurant removed from favorites',
    removedLike
  });
});

// API для работы с инвайт-кодами и статусами пользователей

// Генерация инвайт-кода
app.get('/api/friends/generate-code/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Проверяем, есть ли уже активный код для пользователя
  const existingCode = inviteCodes.find(code => code.userId === userId && !code.isUsed);
  
  if (existingCode) {
    return res.json({ code: existingCode.code });
  }
  
  // Генерируем уникальный код
  const newCode = {
    code: generateUniqueId(),
    userId,
    isUsed: false,
    timestamp: new Date().toISOString()
  };
  
  inviteCodes.push(newCode);
  
  return res.json({ code: newCode.code });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});