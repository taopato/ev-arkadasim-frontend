// Environment configuration - Mobil odaklı
import { Platform } from 'react-native';

const DEV_HTTP = 'http://localhost:5118';
const DEV_HTTPS = 'https://localhost:7118';

// Mobil emülatör için host ayarları
const HOST_DEV_ANDROID = '10.0.2.2'; // Android Emülatör'de "localhost"
const HOST_DEV_IOS = 'localhost';
const HOST_DEV_WEB = 'localhost';

// Platform bazlı host seçimi
const getDevHost = () => {
  if (Platform.OS === 'android') return HOST_DEV_ANDROID;
  if (Platform.OS === 'ios') return HOST_DEV_IOS;
  return HOST_DEV_WEB; // Web için
};

// Backend HTTPS üzerinde çalışıyor
const USE_HTTPS = true;
const DEV_HOST = getDevHost();
const DEV_PORT = 7118; // HTTPS portu kullan

export const BASE_URL = __DEV__ 
  ? `${USE_HTTPS ? 'https' : 'http'}://${DEV_HOST}:${DEV_PORT}`
  : (process.env.EXPO_PUBLIC_API_URL as string) || DEV_HTTPS;

// API timeout süreleri
export const API_TIMEOUTS = {
  DEFAULT: 15000,
  UPLOAD: 30000,
  DOWNLOAD: 60000,
} as const;

// Pagination ayarları
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Mobil özel ayarlar
export const MOBILE_CONFIG = {
  // Mobil'de AsyncStorage kullanımı
  USE_ASYNC_STORAGE: true,
  // Mobil'de HTTP tercih edilir (sertifika sorunları olmaz)
  PREFER_HTTP: true,
  // Platform bilgisi
  PLATFORM: Platform.OS,
} as const;
