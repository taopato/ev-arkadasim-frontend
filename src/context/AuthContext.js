import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Uygulama başladığında token'ı kontrol et
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
        } catch (parseError) {
          console.error('Kullanıcı verisi parse hatası:', parseError);
          // Geçersiz veri varsa temizle
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Token kontrolü hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    try {
      // Token ve kullanıcı bilgilerini sakla
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Token ve kullanıcı bilgilerini temizle
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout hatası:', error);
    }
  };

  const getToken = () => {
    return token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading,
      login, 
      logout, 
      getToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  }
  return context;
};
