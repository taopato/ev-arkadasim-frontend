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
// (NGROK kullansak da dursun; LAN testinde işine yarar.)
const HOST_REAL_DEVICE = '192.168.1.150';

// Emülatör hostları
const HOST_DEV_ANDROID = '10.0.2.2';
const HOST_DEV_IOS = 'localhost';

// Backend portun
const DEV_PORT = 5118;

// HTTP/HTTPS tercihi (lokal geliştirmede genelde HTTP)
const USE_HTTPS = false;
const DEV_PROTOCOL = USE_HTTPS ? 'https' : 'http';

// Emülatörlerde farklı host, gerçek cihazda LAN IP kullan
const getDevHost = (): string => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return HOST_REAL_DEVICE;
  }
  return HOST_DEV_IOS; // Web fallback
};

// Development taban URL (LAN testi)
const DEV_BASE = `${DEV_PROTOCOL}://${getDevHost()}:${DEV_PORT}`;

// Production/EAS override imkanları
const EXTRA_API_URL = (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_API_URL as string | undefined;
const ENV_API_URL = (process.env.EXPO_PUBLIC_API_URL as string) || undefined;

/* ------------------------------------------------------------------
   NGROK TEST OVERRIDE
   - Şu değere o anki NGROK HTTPS adresini yapıştır.
   - BOŞ bırakılırsa (""), otomatik olarak EXTRA/ENV/DEV_BASE'e döner.
------------------------------------------------------------------- */
const NGROK_BASE = ""; // Ngrok kapalıysa boş bırak → LAN/ENV kullan
const USE_NGROK = !!NGROK_BASE && NGROK_BASE.startsWith('http');

/* Seçilen taban URL:
   - Önce NGROK,
   - sonra EXPO_PUBLIC_API_URL (extra/env),
   - en sonda DEV_BASE (LAN).
*/
const SELECTED_BASE =
  (USE_NGROK ? NGROK_BASE : (EXTRA_API_URL || ENV_API_URL)) || (__DEV__ ? DEV_BASE : undefined) || DEV_BASE;

/* ÖNEMLİ:
   İsteklerin zaten '/api/...' ile gidiyor → burada '/api' EKLEME.
   (Aksi halde '/api/api/...' olur.)
*/
export const BASE_URL: string = SELECTED_BASE;

/* İstersen bazı yerlerde kısa yoldan kullanmak için alternatif de bırakıyorum: */
export const API_BASE_URL: string = `${SELECTED_BASE}/api`;

// Diğer yardımcı sabitler
export const API_TIMEOUTS = { DEFAULT: 15000, UPLOAD: 30000, DOWNLOAD: 60000 } as const;
export const PAGINATION = { DEFAULT_PAGE_SIZE: 20, MAX_PAGE_SIZE: 100 } as const;
export const MOBILE_CONFIG = { USE_ASYNC_STORAGE: true, PREFER_HTTP: !USE_HTTPS, PLATFORM: Platform.OS } as const;

// Debug için
export const __ENV_DEBUG__ = {
  __DEV__,
  Platform: Platform.OS,
  DEV_PROTOCOL,
  DEV_PORT,
  BASE_URL,
};

export default BASE_URL;
