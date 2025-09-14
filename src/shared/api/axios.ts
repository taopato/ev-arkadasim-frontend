import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/env';

// Axios instance oluştur
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı AsyncStorage'dan al
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    return null;
  }
};

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  async config => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 DEBUG: Giden istekleri logla
    console.log('🔍 → REQUEST:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data
    });
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - yanıtları normalize et, logla ve hataları yakala
api.interceptors.response.use(
  response => {
    // 🔍 DEBUG: Gelen yanıtları logla
    console.log('🔍 ← RESPONSE:', {
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      status: response.status,
      data: response.data
    });

    // Bazı endpoint'ler application/json yerine text/plain dönebiliyor.
    // İçerik JSON string ise parse edelim.
    const data = response?.data;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      const looksLikeJson =
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'));
      if (looksLikeJson) {
        try {
          response.data = JSON.parse(trimmed);
          console.log('🔍 Parsed JSON response:', response.data);
        } catch (parseError) {
          console.log('🔍 JSON parse hatası:', parseError);
          // parse hatası olursa olduğu gibi bırak
        }
      }
    }

    return response;
  },
  error => {
    console.error('🔍 Axios Error Interceptor:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // 401 Unauthorized hatası durumunda token'ı temizle
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);
