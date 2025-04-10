import React, { useState } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function FullScreenImageViewer({ visible, imageUri, onClose }) {
  const [loading, setLoading] = useState(true);

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
        
        {loading && (
          <ActivityIndicator 
            size="large" 
            color={COLORS.primary} 
            style={styles.loader} 
          />
        )}
        
        <Image
          source={{ uri: typeof imageUri === 'object' ? imageUri.uri : imageUri }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
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
  }
}); 