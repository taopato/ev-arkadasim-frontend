import axios from 'axios';

// API URL'sini kontrol etmek için konsola yazdıralım
const BASE_URL = 'https://192.168.1.33:7008/api';  // HTTPS kullanıyoruz
console.log('API URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Hata durumunda daha iyi kontrol
  },
  // SSL sertifika doğrulamasını devre dışı bırak
  proxy: false,
  withCredentials: false
});

// SSL güvenlik ayarlarını devre dışı bırak
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// İstek interceptor'ı
api.interceptors.request.use(
  async config => {
    // SSL sertifika hatalarını yoksay
    if (process.env.NODE_ENV !== 'production') {
      config.insecure = true;
      config.rejectUnauthorized = false;
    }
    
    console.log('API İsteği Gönderiliyor:', {
      fullUrl: config.baseURL + config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.log('API İstek Hatası:', error);
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı
api.interceptors.response.use(
  response => {
    console.log('API Yanıtı Alındı:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    if (error.response) {
      // Sunucudan yanıt geldi ama hata kodu döndü
      console.log('Sunucu Hatası:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.log('Yanıt Alınamadı:', {
        request: error.request
      });
    } else {
      // İstek yapılırken bir hata oluştu
      console.log('İstek Hatası:', {
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

export default api;
