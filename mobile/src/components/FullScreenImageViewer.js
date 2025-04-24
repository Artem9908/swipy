import React, { useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StatusBar,
  Text,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function FullScreenImageViewer({ visible, imageUri, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Проверяем и обрабатываем URI изображения
  const processImageUri = () => {
    try {
      console.log('Processing image URI:', imageUri);
      
      // Если URI не предоставлен
      if (!imageUri) {
        console.log('No image URI provided');
        return { uri: 'https://via.placeholder.com/400x300?text=No+Image' };
      }
      
      // Если URI - объект с полем uri
      if (typeof imageUri === 'object' && imageUri !== null) {
        if (imageUri.uri) {
          console.log('Image URI is an object with uri field:', imageUri.uri);
          return { uri: imageUri.uri };
        } else {
          console.log('Image URI is an object without uri field');
          return { uri: 'https://via.placeholder.com/400x300?text=Invalid+Image' };
        }
      }
      
      // Если URI - строка
      if (typeof imageUri === 'string') {
        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          console.log('Image URI is a valid URL string:', imageUri);
          return { uri: imageUri };
        } else {
          console.log('Image URI is not a valid URL:', imageUri);
          return { uri: 'https://via.placeholder.com/400x300?text=Invalid+URL' };
        }
      }
      
      // Если ничего не подошло
      console.log('Unable to process image URI, using fallback');
      return { uri: 'https://via.placeholder.com/400x300?text=Error' };
    } catch (err) {
      console.error('Error processing image URI:', err);
      return { uri: 'https://via.placeholder.com/400x300?text=Error' };
    }
  };
  
  // Сброс состояния при изменении видимости
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(false);
    }
  }, [visible]);

  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>
        
        {loading && !error && (
          <ActivityIndicator 
            size="large" 
            color={COLORS.primary} 
            style={styles.loader} 
          />
        )}
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="image-outline" size={60} color="#fff" />
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            source={processImageUri()}
            style={styles.image}
            resizeMode="contain"
            onLoadStart={() => {
              console.log('Image load started');
              setLoading(true);
              setError(false);
            }}
            onLoadEnd={() => {
              console.log('Image load ended');
              setLoading(false);
            }}
            onError={(e) => {
              console.error('Error loading image in viewer:', e.nativeEvent.error);
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
}); 