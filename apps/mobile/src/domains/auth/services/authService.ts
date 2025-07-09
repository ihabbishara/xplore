import AsyncStorage from '@react-native-async-storage/async-storage';
import {api} from '../../../services/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  token: string;
  refreshToken?: string;
}

const AUTH_TOKEN_KEY = '@xplore_auth_token';
const REFRESH_TOKEN_KEY = '@xplore_refresh_token';
const USER_DATA_KEY = '@xplore_user_data';

export const loginUser = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    // Store tokens and user data
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    if (response.data.refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
    }
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    throw new Error('Invalid email or password');
  }
};

export const registerUser = async (
  data: RegisterData,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);

    // Store tokens and user data
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    if (response.data.refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
    }
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Registration failed');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await api.post('/auth/forgot-password', {email});
  } catch (error) {
    throw new Error('Failed to send reset email');
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    // Clear local storage
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
    
    // Call logout endpoint if needed
    await api.post('/auth/logout');
  } catch (error) {
    // Even if API call fails, clear local storage
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
  }
};

export const getStoredAuth = async (): Promise<{
  token: string | null;
  user: any | null;
}> => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const userJson = await AsyncStorage.getItem(USER_DATA_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    
    return {token, user};
  } catch (error) {
    return {token: null, user: null};
  }
};

export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const response = await api.post<{token: string}>('/auth/refresh', {
      refreshToken,
    });

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    return response.data.token;
  } catch (error) {
    return null;
  }
};