import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

// Mobil odaklı storage (AsyncStorage öncelikli)
const getStorage = () => {
  // Web'de localStorage varsa kullan, yoksa AsyncStorage
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: (key: string) => window.localStorage.removeItem(key),
      multiRemove: (keys: string[]) => keys.forEach(key => window.localStorage.removeItem(key)),
    };
  }
  // Mobil'de AsyncStorage kullan
  return AsyncStorage;
};

const storage = getStorage();

export const tokenStorage = {
  // Token işlemleri
  getToken: async (): Promise<string | null> => {
    try {
      return await storage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Token alınırken hata:', error);
      return null;
    }
  },

  setToken: async (token: string): Promise<void> => {
    try {
      await storage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Token kaydedilirken hata:', error);
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await storage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Token silinirken hata:', error);
    }
  },

  // Kullanıcı işlemleri
  getUser: async (): Promise<any | null> => {
    try {
      const userStr = await storage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Kullanıcı alınırken hata:', error);
      return null;
    }
  },

  setUser: async (user: any): Promise<void> => {
    try {
      await storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Kullanıcı kaydedilirken hata:', error);
    }
  },

  removeUser: async (): Promise<void> => {
    try {
      await storage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
    }
  },

  // Tüm auth verilerini temizle
  clearAuth: async (): Promise<void> => {
    try {
      await storage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Auth verileri temizlenirken hata:', error);
    }
  },
};
