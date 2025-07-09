import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3001/api',
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api',
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('@xplore_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = await AsyncStorage.getItem('@xplore_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const newToken = response.data.token;
          await AsyncStorage.setItem('@xplore_auth_token', newToken);
          
          // Retry original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await AsyncStorage.multiRemove([
            '@xplore_auth_token',
            '@xplore_refresh_token',
            '@xplore_user_data',
          ]);
          // Handle logout in app
        }
      }
    }
    return Promise.reject(error);
  },
);