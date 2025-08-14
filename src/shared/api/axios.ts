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
    console.error('Token alınırken hata:', error);
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
    return config;
  },
  error => {
    console.error('Request interceptor hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - yanıtları normalize et, logla ve hataları yakala
api.interceptors.response.use(
  response => {
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
        } catch (_) {
          // parse hatası olursa olduğu gibi bırak
        }
      }
    }

    console.log('API Başarılı:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('API Hatası:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      BASE_URL,
    });

    // 401 Unauthorized hatası durumunda token'ı temizle
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
      console.log('Token temizlendi - 401 hatası');
    }

    // 500 Server Error
    if (error.response?.status === 500) {
      console.error('Sunucu hatası:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    // Network Error
    if (error.code === 'NETWORK_ERROR' || (typeof error.message === 'string' && error.message.includes('Network Error'))) {
      console.error('Ağ bağlantı hatası - Backend çalışıyor mu? BASE_URL:', BASE_URL);
    }

    return Promise.reject(error);
  }
);
