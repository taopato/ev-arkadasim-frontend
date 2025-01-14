import axios from 'axios';

const api = axios.create({
  baseURL: 'https://192.168.1.33:7008/api/Auth', // HTTPS adresinizi belirtin
  timeout: 30000,
});

export default api;
