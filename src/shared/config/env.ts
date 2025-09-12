// src/shared/config/env.ts
import { Platform } from 'react-native';
// @ts-ignore - expo-constants runtime import for reading extra
import Constants from 'expo-constants';

/**
 * Geliştirme senaryoları:
 * - iOS Simülatör: localhost
 * - Android Emülatör: 10.0.2.2
 * - Gerçek cihaz (iOS/Android, Expo Go ile): AĞDAKI BİLGİSAYARIN LAN IP'si
 *
 * Not: Production/EAS build için EXPO_PUBLIC_API_URL ile override edebilirsin.
 */

// ==== ❶ BURAYI KENDİ MAKİNENİN IP'Sİ İLE DOLDUR ====
const HOST_REAL_DEVICE = '192.168.1.150'; // Örn: 192.168.1.35 gibi

// Emülatör hostları
const HOST_DEV_ANDROID = '10.0.2.2';
const HOST_DEV_IOS = 'localhost';

// Backend portun (Swagger’da gördüğün port)
const DEV_PORT = 5118;

// HTTP/HTTPS tercihi (geliştirmede genelde HTTP en sorunsuzudur)
const USE_HTTPS = false;
const DEV_PROTOCOL = USE_HTTPS ? 'https' : 'http';

// Emülatörlerde farklı host, gerçek cihazda LAN IP kullan
const getDevHost = (): string => {
  // Expo Go ile GERÇEK CİHAZ: LAN IP kullan
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Emülatör mü gerçek cihaz mı ayırma:
    // Emülatör tespitine uğraşmadan, LAN IP'yi seçiyoruz.
    return HOST_REAL_DEVICE;
  }
  // Web fallback
  return HOST_DEV_IOS; // Web için localhost kullan
};

// Development taban URL (Expo Go’da gerçek cihazdan erişim için LAN IP)
const DEV_BASE = `${DEV_PROTOCOL}://${getDevHost()}:${DEV_PORT}`;

// Production/EAS build için override imkanı:
//  - `EXPO_PUBLIC_API_URL` tanımlıysa onu kullanır (örn: https://api.domain.com)
const EXTRA_API_URL = (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_API_URL as string | undefined;
const ENV_API_URL = (process.env.EXPO_PUBLIC_API_URL as string) || undefined;

export const BASE_URL: string =
  (EXTRA_API_URL || ENV_API_URL) || (__DEV__ ? DEV_BASE : undefined) || DEV_BASE;

// Diğer yardımcı sabitler (opsiyonel)
export const API_TIMEOUTS = { DEFAULT: 15000, UPLOAD: 30000, DOWNLOAD: 60000 } as const;
export const PAGINATION = { DEFAULT_PAGE_SIZE: 20, MAX_PAGE_SIZE: 100 } as const;
export const MOBILE_CONFIG = { USE_ASYNC_STORAGE: true, PREFER_HTTP: !USE_HTTPS, PLATFORM: Platform.OS } as const;

// Debug istersen:
export const __ENV_DEBUG__ = {
  __DEV__,
  Platform: Platform.OS,
  DEV_PROTOCOL,
  DEV_PORT,
  BASE_URL,
};

export default BASE_URL;
