// API URL configuration
const DEV_API_URL = 'http://192.168.0.82:5001';
const PROD_API_URL = 'https://api.swipy.app'; // Replace with your actual production API URL

// Determine which API URL to use based on the environment
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Other configuration constants
export const APP_CONFIG = {
  // App version
  VERSION: '1.0.0',
  
  // Minimum password length
  MIN_PASSWORD_LENGTH: 8,
  
  // Maximum file upload size (in bytes)
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Supported image formats
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif'],
  
  // Cache duration (in milliseconds)
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // API timeout (in milliseconds)
  API_TIMEOUT: 10000, // 10 seconds
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  
  // Session
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Please check your internet connection and try again.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    INVALID_CREDENTIALS: 'Invalid username or password.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
  },
}; 