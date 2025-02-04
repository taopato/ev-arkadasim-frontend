import axios from 'axios';

// API URL'sini kontrol etmek için konsola yazdıralım
const BASE_URL = 'https://192.168.1.33:7008/api';  // HTTPS kullanıyoruz
console.log('API URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// SSL sertifika hatalarını yoksay (sadece geliştirme ortamında)
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// İstek interceptor'ı
api.interceptors.request.use(
  async config => {
    // Debug için istek detaylarını logla
    if (process.env.NODE_ENV === 'development') {
      console.log('API İsteği:', {
        url: config.url,
        method: config.method,
        data: config.data
      });
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı
api.interceptors.response.use(
  response => {
    // Debug için yanıt detaylarını logla
    if (process.env.NODE_ENV === 'development') {
      console.log('API Yanıtı:', {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  error => {
    // Hata detaylarını logla
    if (process.env.NODE_ENV === 'development') {
      console.error('API Hatası:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
    return Promise.reject(error);
  }
);

export default api;
