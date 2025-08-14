import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL as ENV_BASE } from '../shared/config/env';

// ====== BASE URL ======
const BASE_URL = `${ENV_BASE}/api`;

// Axios instance oluştur
const api = axios.create({
  baseURL: BASE_URL,
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
    const urlPath = typeof config.url === 'string' ? config.url : '';
    const isAuthRequest = urlPath.startsWith('/Auth/');
    const token = await getAuthToken();
    if (token && !isAuthRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isAuthRequest && config.headers && config.headers.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  },
  error => {
    console.error('Request interceptor hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - yanıtları logla ve hataları yakala
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API Hatası:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // 401 Unauthorized hatası durumunda token'ı temizle
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
      console.log('Token temizlendi - 401 hatası');
    }

    // 500 Server Error
    if (error.response?.status === 500) {
      console.error('Sunucu hatası:', error.response.data);
    }

    // Network Error
    if (error.code === 'NETWORK_ERROR' || (typeof error.message === 'string' && error.message.includes('Network Error'))) {
      console.error('Ağ bağlantı hatası - Backend çalışıyor mu? BASE_URL:', BASE_URL);
    }

    return Promise.reject(error);
  }
);

// API endpoint'leri için yardımcı sabitler
export const apiEndpoints = {
  // Auth endpoints
  auth: {
    login: '/Auth/Login',
    sendVerificationCode: '/Auth/SendVerificationCode',
    verifyCodeAndRegister: '/Auth/VerifyCodeAndRegister',
    verifyCodeForReset: '/Auth/VerifyCodeForReset',
    resetPassword: '/Auth/ResetPassword',
  },

  // Houses endpoints
  houses: {
    getAll: '/Houses',
    create: '/Houses',
    getById: (id) => `/Houses/${id}`,
    addMember: (id) => `/Houses/${id}/members`,
    removeMember: (id, userId) => `/Houses/${id}/members/${userId}`,
    sendInvitation: (houseId) => `/Houses/${houseId}/invitations`,
    acceptInvitation: '/Houses/AcceptInvitation',
    getMembers: (houseId) => `/Houses/${houseId}/members`,
    getUserDebts: (userId, houseId) => `/Houses/GetUserDebts/${userId}/${houseId}`,
    getUserReceivables: (userId, houseId) => `/Houses/GetUserReceivables/${userId}/${houseId}`,
    getUserHouses: (userId) => `/Houses/GetUserHouses/${userId}`,
    spendingOverview: (houseId, from, to, recentLimit) => `/Houses/${houseId}/spending-overview?from=${from || ''}&to=${to || ''}&recentLimit=${recentLimit || ''}`,
  },

  // Expenses endpoints
  expenses: {
    getAll: '/Expenses',
    create: '/Expenses',
    addExpense: '/Expenses/AddExpense',
    getByHouse: (houseId) => `/Expenses/GetExpenses/${houseId}`,
    getById: (expenseId) => `/Expenses/GetExpense/${expenseId}`,
    delete: (expenseId) => `/Expenses/DeleteExpense/${expenseId}`,
    update: (expenseId) => `/Expenses/UpdateExpense/${expenseId}`,
  },

  // Bills endpoints
  bills: {
    create: '/Bills',
    finalize: (billId, requestUserId) => `/Bills/${billId}/finalize?requestUserId=${requestUserId}`,
    uploadDocument: (billId, requestUserId) => `/Bills/${billId}/documents?requestUserId=${requestUserId}`,
    getRecent: (houseId, utilityType, limit) => `/Bills/recent?houseId=${houseId}&utilityType=${utilityType}&limit=${limit || 10}`,
    getByHouse: (houseId) => `/Bills?houseId=${houseId}`,
    getByHouseAndType: (houseId, utilityType) => `/Bills?houseId=${houseId}&utilityType=${utilityType}`,
    getById: (billId) => `/Bills/GetBill/${billId}`,
    delete: (billId) => `/Bills/DeleteBill/${billId}`,
    update: (billId) => `/Bills/UpdateBill/${billId}`,
  },

  // Payments endpoints
  payments: {
    create: '/Payments/CreatePayment',
    getByHouse: (houseId) => `/Payments/GetPayments/${houseId}`,
    getPendingPayments: (userId) => `/Payments/GetPendingPayments/${userId}`,
    approvePayment: (paymentId) => `/Payments/ApprovePayment/${paymentId}`,
    rejectPayment: (paymentId) => `/Payments/RejectPayment/${paymentId}`,
    addPaymentWithAllocations: '/Payments/AddPaymentWithAllocations',
  },

  // Users endpoints
  users: {
    getAll: '/Users',
    create: '/Users',
    getAllUsers: '/Users/GetAllUsers',
    getById: (userId) => `/Users/${userId}`,
    paymentHistory: (userId) => `/Users/${userId}/payment-history`,
  },
};

// -------- Yardımcı API Fonksiyonları --------

// Auth işlemleri
export const authApi = {
  login: async (loginData) => {
    return await api.post('/Auth/Login', loginData);
  },
  sendVerificationCode: async (email) => {
    return await api.post('/Auth/SendVerificationCode', { email });
  },
  verifyCodeAndRegister: async (email, code, fullName, password) => {
    return await api.post('/Auth/VerifyCodeAndRegister', {
      email, code, fullName, password
    });
  },
  verifyCodeForReset: async (email, code) => {
    return await api.post('/Auth/VerifyCodeForReset', { email, code });
  },
  resetPassword: async (email, code, newPassword) => {
    return await api.post('/Auth/ResetPassword', {
      email, code, newPassword
    });
  },
};

// House işlemleri
export const houseApi = {
  getAll: async () => {
    return await api.get('/Houses');
  },
  create: async (name, creatorUserId) => {
    return await api.post('/Houses', { name, creatorUserId });
  },
  getById: async (id) => {
    return await api.get(`/Houses/${id}`);
  },
  addMember: async (houseId, userId) => {
    return await api.post(`/Houses/${houseId}/members`, { houseId, userId });
  },
  removeMember: async (houseId, userId) => {
    return await api.delete(`/Houses/${houseId}/members/${userId}`);
  },
  sendInvitation: async (houseId, email) => {
    return await api.post(`/Houses/${houseId}/invitations`, { email });
  },
  acceptInvitation: async (userId, invitationCode) => {
    return await api.post('/Houses/AcceptInvitation', { userId, invitationCode });
  },
  getMembers: async (houseId) => {
    return await api.get(`/Houses/${houseId}/members`);
  },
  getUserDebts: async (userId, houseId) => {
    return await api.get(`/Houses/GetUserDebts/${userId}/${houseId}`);
  },
  getUserReceivables: async (userId, houseId) => {
    return await api.get(`/Houses/GetUserReceivables/${userId}/${houseId}`);
  },
  getUserHouses: async (userId) => {
    return await api.get(`/Houses/GetUserHouses/${userId}`);
  },
  createHouse: async (houseData) => {
    return await api.post('/Houses', houseData);
  },
  getSpendingOverview: async (houseId, from, to, recentLimit) => {
    return await api.get(`/Houses/${houseId}/spending-overview?from=${from || ''}&to=${to || ''}&recentLimit=${recentLimit || ''}`);
  },
};

// Expenses işlemleri
export const expensesApi = {
  getAll: async () => {
    return await api.get('/Expenses');
  },
  create: async (expenseData) => {
    return await api.post('/Expenses', expenseData);
  },
  addExpense: async (expenseData) => {
    return await api.post('/Expenses/AddExpense', expenseData);
  },
  getByHouse: async (houseId) => {
    return await api.get(`/Expenses/GetExpenses/${houseId}`);
  },
  getById: async (expenseId) => {
    return await api.get(`/Expenses/GetExpense/${expenseId}`);
  },
  delete: async (expenseId) => {
    return await api.delete(`/Expenses/DeleteExpense/${expenseId}`);
  },
  update: async (expenseId, expenseData) => {
    return await api.put(`/Expenses/UpdateExpense/${expenseId}`, expenseData);
  },
};

// Bills işlemleri
export const billsApi = {
  create: async (billData) => {
    // Plan: { houseId, title, amount, billDate, dueDate, paidByUserId, shareType }
    return await api.post('/Bills', billData);
  },
  finalize: async (billId, approverUserId) => {
    // Plan: POST /Bills/{billId}/finalize with optional body { approverUserId }
    const body = approverUserId ? { approverUserId } : {};
    return await api.post(`/Bills/${billId}/finalize`, body);
  },
  uploadDocument: async (billId, file) => {
    // Plan: POST /Bills/{billId}/documents (multipart/form-data)
    const formData = new FormData();
    formData.append('file', file);
    return await api.post(`/Bills/${billId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getRecent: async (houseId, take = 10) => {
    // Plan: /Bills/recent?houseId={id}&take={n}
    return await api.get(`/Bills/recent?houseId=${houseId}&take=${take}`);
  },
  getByHouse: async (houseId) => {
    return await api.get(`/Bills/GetBills/${houseId}`);
  },
  getByHouseAndType: async (houseId, utilityType) => {
    return await api.get(`/Bills/GetBills/${houseId}?utilityType=${utilityType}`);
  },
  getById: async (billId) => {
    return await api.get(`/Bills/GetBill/${billId}`);
  },
  delete: async (billId) => {
    return await api.delete(`/Bills/DeleteBill/${billId}`);
  },
  update: async (billId, billData) => {
    return await api.put(`/Bills/UpdateBill/${billId}`, billData);
  },
};

// Payments işlemleri
export const paymentsApi = {
  create: async (paymentData) => {
    // Plan: JSON body { houseId, borcluUserId, alacakliUserId, tutar, method, note }
    return await api.post('/Payments/CreatePayment', {
      houseId: paymentData.houseId,
      borcluUserId: paymentData.borcluUserId,
      alacakliUserId: paymentData.alacakliUserId,
      tutar: paymentData.tutar,
      method: paymentData.method || 'BankTransfer',
      note: paymentData.note,
    });
  },
  getByHouse: async (houseId) => {
    return await api.get(`/Payments/GetPayments/${houseId}`);
  },
  getPendingPayments: async (userId) => {
    return await api.get(`/Payments/GetPendingPayments/${userId}`);
  },
  approvePayment: async (paymentId, approverUserId) => {
    // Plan: optional body { approverUserId }
    const body = approverUserId ? { approverUserId } : {};
    return await api.post(`/Payments/ApprovePayment/${paymentId}`, body);
  },
  rejectPayment: async (paymentId, reason) => {
    // Plan: optional body { reason }
    const body = reason ? { reason } : {};
    return await api.post(`/Payments/RejectPayment/${paymentId}`, body);
  },
  addPaymentWithAllocations: async (paymentData) => {
    return await api.post('/Payments/AddPaymentWithAllocations', {
      houseId: paymentData.houseId,
      payerUserId: paymentData.payerUserId,
      note: paymentData.note,
      allocations: paymentData.allocations
    });
  },
};

// Users işlemleri
export const usersApi = {
  getAll: async () => {
    return await api.get('/Users');
  },
  create: async (fullName, email, password) => {
    return await api.post('/Users', { fullName, email, password });
  },
  getAllUsers: async () => {
    return await api.get('/Users/GetAllUsers');
  },
  getById: async (userId) => {
    return await api.get(`/Users/${userId}`);
  },
  getPaymentHistory: async (userId, houseId, limit) => {
    return await api.get(`/Users/${userId}/payment-history?houseId=${houseId || ''}&limit=${limit || 10}`);
  },
};

// API instance'ını export et
export default api;
