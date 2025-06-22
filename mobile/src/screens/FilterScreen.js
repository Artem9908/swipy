import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  SafeAreaView,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import axios from 'axios';

// Google Places API Key - you should store this in an environment variable
const GOOGLE_PLACES_API_KEY = 'AIzaSyAt3PNU2oefv5rYg9GGr3koH1DfqxeJGqM';

export default function FilterScreen({ navigation, route }) {
  const { currentFilters, user, onApplyFilters } = route.params || {};
  
  // Set initial filter values
  const [filters, setFilters] = useState({
    location: currentFilters?.location || 'New York',
    cuisine: currentFilters?.cuisine || 'all',
    priceRange: currentFilters?.priceRange || 'all',
    minRating: currentFilters?.minRating || 0,
    radius: currentFilters?.radius || 5000,
    openNow: currentFilters?.openNow || false,
    vegetarian: currentFilters?.vegetarian || false,
    vegan: currentFilters?.vegan || false,
    glutenFree: currentFilters?.glutenFree || false,
  });
  
  // Location search state
  const [locationQuery, setLocationQuery] = useState(filters.location);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationTimeoutRef = useRef(null);
  
  // Available cuisines
  const cuisines = [
    { id: 'all', name: 'All Cuisines' },
    { id: 'italian', name: 'Italian' },
    { id: 'japanese', name: 'Japanese' },
    { id: 'mexican', name: 'Mexican' },
    { id: 'chinese', name: 'Chinese' },
    { id: 'indian', name: 'indpak' },
    { id: 'thai', name: 'Thai' },
    { id: 'french', name: 'French' },
    { id: 'american', name: 'tradamerican' },
    { id: 'korean', name: 'Korean' },
    { id: 'vietnamese', name: 'Vietnamese' },
  ];
  
  // Price ranges
  const priceRanges = [
    { id: 'all', name: 'Any Price', icon: 'cash-outline' },
    { id: '1', name: '£', icon: 'cash-outline' },
    { id: '2', name: '££', icon: 'cash-outline' },
    { id: '3', name: '£££', icon: 'cash-outline' },
    { id: '4', name: '££££', icon: 'cash-outline' },
    { id: '5', name: '£100+', icon: 'cash-outline' },
  ];
  
  // Ratings
  const ratings = [0, 1, 2, 3, 4, 5];
  
  // Fetch location suggestions when user types
  useEffect(() => {
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    if (locationQuery.length > 2) {
      setIsLoadingSuggestions(true);
      setShowSuggestions(true);
      locationTimeoutRef.current = setTimeout(() => {
        fetchLocationSuggestions(locationQuery);
      }, 500);
    } else {
      setLocationSuggestions([]);
      setIsLoadingSuggestions(false);
      setShowSuggestions(false);
    }
    
    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, [locationQuery]);
  
  // Fetch location suggestions from Google Places API
  const fetchLocationSuggestions = async (query) => {
    try {
      // Use Google Places Autocomplete API for all place types (addresses and cities)
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`
      );
      if (response.data && response.data.predictions) {
        setLocationSuggestions(response.data.predictions.slice(0, 5));
      } else {
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Fallback to mock suggestions if API fails
      const mockSuggestions = [
        { place_id: '1', description: 'New York, NY, USA' },
        { place_id: '2', description: 'London, UK' },
        { place_id: '3', description: 'Paris, France' },
        { place_id: '4', description: 'Tokyo, Japan' },
        { place_id: '5', description: 'Sydney, Australia' }
      ];
      setLocationSuggestions(mockSuggestions);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Just use "Current Location" as the name
          setLocationQuery('Current Location');
          setFilters({
            ...filters,
            location: 'Current Location',
            latitude,
            longitude
          });
          setIsLoadingLocation(false);
          setLocationSuggestions([]);
          setShowSuggestions(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Location Error', 'Unable to get your current location. Please enter a location manually.');
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      Alert.alert('Location Not Supported', 'Your device does not support location services. Please enter a location manually.');
      setIsLoadingLocation(false);
    }
  };
  
  // Select a location from suggestions
  const selectLocation = async (location) => {
    setLocationQuery(location.description);
    // Fetch place details to get coordinates
    try {
      const detailsRes = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.place_id}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const details = detailsRes.data.result;
      setFilters({
        ...filters,
        location: location.description,
        placeId: location.place_id,
        latitude: details.geometry?.location?.lat,
        longitude: details.geometry?.location?.lng
      });
    } catch (e) {
      setFilters({
        ...filters,
        location: location.description,
        placeId: location.place_id
      });
    }
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };
  
  // Reset filters to default values
  const resetFilters = () => {
    const defaultFilters = {
      location: 'New York',
      cuisine: 'all',
      priceRange: 'all',
      minRating: 0,
      radius: 5000,
      openNow: false,
      vegetarian: false,
      vegan: false,
      glutenFree: false,
    };
    
    setFilters(defaultFilters);
    setLocationQuery(defaultFilters.location);
  };
  
  // Apply filters and navigate back
  const applyFilters = async () => {
    let preparedFilters = {
      ...filters,
      vegetarian: filters.vegetarian ? 'true' : undefined,
      vegan: filters.vegan ? 'true' : undefined,
      glutenFree: filters.glutenFree ? 'true' : undefined,
      openNow: filters.openNow ? 'true' : undefined,
      minRating: filters.minRating,
      priceRange: filters.priceRange,
      radius: filters.radius,
      latitude: filters.latitude,
      longitude: filters.longitude
    };
    // If locationQuery is not empty and no coordinates, geocode it
    if (locationQuery && (!filters.latitude || !filters.longitude)) {
      try {
        const geoRes = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_PLACES_API_KEY}`
        );
        const geo = geoRes.data.results[0];
        if (geo) {
          preparedFilters.location = geo.formatted_address;
          preparedFilters.latitude = geo.geometry.location.lat;
          preparedFilters.longitude = geo.geometry.location.lng;
        }
      } catch (e) {
        // fallback: just use the string
        preparedFilters.location = locationQuery;
      }
    }
    if (onApplyFilters) {
      onApplyFilters(preparedFilters);
    }
    Alert.alert('Filters Applied', 'Your filters have been applied.');
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.helperText}>Enter a city or use your current location to find restaurants nearby.</Text>
          <View style={styles.locationContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={locationQuery}
                onChangeText={setLocationQuery}
                placeholder="Enter city or address"
                placeholderTextColor={COLORS.text.light}
                onFocus={() => setShowSuggestions(true)}
              />
              {locationQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setLocationQuery('');
                    setLocationSuggestions([]);
                    setShowSuggestions(false);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
              )}
              <Text style={styles.currentLocationText}>My Location</Text>
            </TouchableOpacity>
          </View>
          
          {/* Location Suggestions */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {isLoadingSuggestions ? (
                <ActivityIndicator style={styles.loadingIndicator} size="small" color={COLORS.primary} />
              ) : (
                <View style={styles.suggestionsList}>
                  {locationSuggestions.length === 0 && locationQuery.length > 2 ? (
                    <Text style={styles.noResultsText}>No locations found</Text>
                  ) : (
                    locationSuggestions.map(item => (
                      <TouchableOpacity
                        key={item.place_id}
                        style={styles.suggestionItem}
                        onPress={() => selectLocation(item)}
                      >
                        <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
                        <View style={styles.suggestionTextContainer}>
                          <Text style={styles.suggestionMainText}>{item.description}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.divider} />
        
        {/* Cuisine Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisine</Text>
          <Text style={styles.helperText}>Select your preferred cuisine.</Text>
          <View style={styles.cuisineContainer}>
            {cuisines.map((cuisine) => (
              <TouchableOpacity
                key={cuisine.id}
                style={[
                  styles.cuisineButton,
                  filters.cuisine === cuisine.id && styles.selectedCuisine
                ]}
                onPress={() => setFilters({...filters, cuisine: cuisine.id})}
              >
                <Text 
                  style={[
                    styles.cuisineText,
                    filters.cuisine === cuisine.id && styles.selectedCuisineText
                  ]}
                >
                  {cuisine.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Price Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <Text style={styles.helperText}>Select your preferred price range.</Text>
          <View style={styles.priceContainer}>
            {priceRanges.map((price) => (
              <TouchableOpacity
                key={price.id}
                style={[
                  styles.priceButton,
                  filters.priceRange === price.id && styles.selectedPrice
                ]}
                onPress={() => setFilters({...filters, priceRange: price.id})}
              >
                <Ionicons name={price.icon} size={20} color={filters.priceRange === price.id ? COLORS.text.inverse : COLORS.text.primary} />
                <Text 
                  style={[
                    styles.priceText,
                    filters.priceRange === price.id && styles.selectedPriceText
                  ]}
                >
                  {price.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <Text style={styles.helperText}>Select the minimum rating you prefer.</Text>
          <View style={styles.ratingContainer}>
            {ratings.map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  filters.minRating === rating && styles.selectedRating
                ]}
                onPress={() => setFilters({...filters, minRating: rating})}
              >
                <Text 
                  style={[
                    styles.ratingText,
                    filters.minRating === rating && styles.selectedRatingText
                  ]}
                >
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Distance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <Text style={styles.helperText}>Select the maximum distance you are willing to travel.</Text>
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceValue}>{filters.radius / 1000} km</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity 
                style={styles.sliderButton}
                onPress={() => setFilters({...filters, radius: Math.max(1000, filters.radius - 1000)})}
              >
                <Ionicons name="remove" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill,
                    { width: `${(filters.radius / 20000) * 100}%` }
                  ]}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.sliderButton}
                onPress={() => setFilters({...filters, radius: Math.min(20000, filters.radius + 1000)})}
              >
                <Ionicons name="add" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Additional Options Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          <Text style={styles.helperText}>Select any additional options you prefer.</Text>
          <View style={styles.optionsContainer}>
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>Open Now</Text>
              <Switch
                value={filters.openNow}
                onValueChange={(value) => setFilters({...filters, openNow: value})}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>Vegetarian Options</Text>
              <Switch
                value={filters.vegetarian}
                onValueChange={(value) => setFilters({...filters, vegetarian: value})}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>Vegan Options</Text>
              <Switch
                value={filters.vegan}
                onValueChange={(value) => setFilters({...filters, vegan: value})}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>Gluten-Free Options</Text>
              <Switch
                value={filters.glutenFree}
                onValueChange={(value) => setFilters({...filters, glutenFree: value})}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <ActionButton 
          title="Apply Filters" 
          onPress={applyFilters}
          style={styles.applyButton}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  resetButton: {
    padding: SIZES.padding.sm,
  },
  resetText: {
    ...FONTS.body,
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: SIZES.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.md,
  },
  helperText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.md,
  },
  locationContainer: {
    marginBottom: SIZES.padding.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.padding.md,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginRight: SIZES.padding.sm,
  },
  input: {
    flex: 1,
    height: 50,
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  clearButton: {
    padding: SIZES.padding.sm,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.padding.md,
  },
  currentLocationText: {
    ...FONTS.body,
    color: COLORS.primary,
    marginLeft: SIZES.padding.sm,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius.md,
    marginTop: SIZES.padding.sm,
    maxHeight: 200,
  },
  loadingIndicator: {
    padding: SIZES.padding.md,
  },
  noResultsText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    padding: SIZES.padding.md,
    textAlign: 'center',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  suggestionTextContainer: {
    marginLeft: SIZES.padding.md,
    flex: 1,
  },
  suggestionMainText: {
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cuisineButton: {
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginRight: SIZES.padding.sm,
    marginBottom: SIZES.padding.sm,
    backgroundColor: COLORS.white,
  },
  selectedCuisine: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cuisineText: {
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  selectedCuisineText: {
    color: COLORS.text.inverse,
  },
  priceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginRight: SIZES.padding.sm,
    marginBottom: SIZES.padding.sm,
    backgroundColor: COLORS.white,
  },
  selectedPrice: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priceText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.sm,
  },
  selectedPriceText: {
    color: COLORS.text.inverse,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  ratingButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginRight: SIZES.padding.sm,
    backgroundColor: COLORS.white,
  },
  selectedRating: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingText: {
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  selectedRatingText: {
    color: COLORS.text.inverse,
  },
  distanceContainer: {
    alignItems: 'center',
  },
  distanceValue: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.md,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  sliderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  sliderTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    marginHorizontal: SIZES.padding.md,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  optionsContainer: {
    marginTop: SIZES.padding.sm,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionText: {
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  footer: {
    padding: SIZES.padding.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  applyButton: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    marginVertical: SIZES.padding.lg,
  },
}); 