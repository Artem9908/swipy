import { Platform } from 'react-native';

// API URL depends on platform
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:5001' 
  : 'http://192.168.0.82:5001';

export { API_URL }; 