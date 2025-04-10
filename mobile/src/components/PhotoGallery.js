import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  Modal, 
  StatusBar,
  FlatList,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function PhotoGallery({ photos, style }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.noPhotosContainer, style]}>
        <Ionicons name="images-outline" size={50} color={COLORS.text.light} />
        <Text style={styles.noPhotosText}>No photos available</Text>
      </View>
    );
  }
  
  const openGallery = (index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };
  
  const closeGallery = () => {
    setModalVisible(false);
  };
  
  const goToPrevious = () => {
    setSelectedIndex((prevIndex) => 
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setSelectedIndex((prevIndex) => 
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const renderThumbnail = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.thumbnailContainer} 
      onPress={() => openGallery(index)}
    >
      <Image 
        source={{ uri: item }} 
        style={styles.thumbnail} 
        resizeMode="cover" 
      />
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={photos.slice(0, 6)} // Показываем только первые 6 фото
        renderItem={renderThumbnail}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailList}
      />
      
      {photos.length > 6 && (
        <TouchableOpacity 
          style={styles.morePhotosButton}
          onPress={() => openGallery(5)}
        >
          <Text style={styles.morePhotosText}>+{photos.length - 5} more</Text>
        </TouchableOpacity>
      )}
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeGallery}
      >
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        <View style={styles.modalContainer}>
          <Image 
            source={{ uri: photos[selectedIndex] }} 
            style={styles.fullImage} 
            resizeMode="contain" 
          />
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeGallery}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton]} 
            onPress={goToPrevious}
          >
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton]} 
            onPress={goToNext}
          >
            <Ionicons name="chevron-forward" size={30} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {selectedIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  thumbnailList: {
    paddingHorizontal: SIZES.padding.md,
  },
  thumbnailContainer: {
    marginRight: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  thumbnail: {
    width: 120,
    height: 90,
  },
  morePhotosButton: {
    position: 'absolute',
    right: SIZES.padding.md,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.sm,
  },
  morePhotosText: {
    ...FONTS.caption,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  counter: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: SIZES.radius.md,
  },
  counterText: {
    ...FONTS.body,
    color: '#fff',
  },
  noPhotosContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    marginHorizontal: SIZES.padding.md,
  },
  noPhotosText: {
    ...FONTS.body,
    color: COLORS.text.light,
    marginTop: SIZES.padding.sm,
  }
}); 