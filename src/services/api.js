import axios from 'axios';

const api = axios.create({
  baseURL: 'https://192.168.1.102:7008/api/Auth', // Backend URL'inizi buraya yazın
  timeout: 30000,
});

export default api;
