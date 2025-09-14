// src/constants/ExpenseEnums.js

// String enum benzeri sabitler
export const ExpenseCategory = {
  Water: 'Water',
  Electricity: 'Electricity',
  Rent: 'Rent',
  Gas: 'Gas',
  Other: 'Other',
  Internet: 'Internet',
  Market: 'Market',
  Food: 'Food',
};

export const SplitPolicy = { Esit: 'Esit', KisiBazli: 'KisiBazli' };
export const PaymentMethod = { Cash: 'Cash', BankTransfer: 'BankTransfer' };
export const PaymentStatus = { Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected' };

// Backend PaylasimTuru enum (1-5)
export const PaylasimTuru = {
  Ortak: 1,      // Ortak harcama
  Kira: 2,       // Kira
  Elektrik: 3,   // Elektrik
  Su: 4,         // Su
  Yemek: 5       // Yemek
};

// Kategori ID -> Anahtar
const CATEGORY_ID_TO_KEY = {
  0: 'Rent',
  1: 'Internet',
  2: 'Electricity',
  3: 'Water',
  4: 'Gas',
  5: 'Food',
  6: 'Market',
  99: 'Other',
};

// UI görünen isim
export const getCategoryDisplayName = (category) => {
  const map = {
    Water: 'Su',
    Electricity: 'Elektrik',
    Rent: 'Kira',
    Gas: 'Doğalgaz',
    Other: 'Diğer',
    Internet: 'İnternet',
    Market: 'Market',
    Food: 'Yemek',
    0: 'Kira', 1: 'İnternet', 2: 'Elektrik', 3: 'Su', 4: 'Doğalgaz', 5: 'Yemek', 99: 'Diğer',
  };
  return map[category] ?? String(category);
};

// Backend’in beklediği numerik enum’a çeviri
export const toExpenseCategory = (nameOrId) => {
  const byName = {
    Elektrik: 2, Su: 3, 'Doğalgaz': 4, Dogalgaz: 4,
    İnternet: 1, Internet: 1, Kira: 0,
    Market: 6, Yemek: 5, Diğer: 99, Diger: 99,
    Electricity: 2, Water: 3, Gas: 4, Rent: 0, Other: 99, Food: 5,
  };
  const byId = { 0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 99:99 };
  if (typeof nameOrId === 'number') return byId[nameOrId] ?? 99;
  return byName[nameOrId] ?? 99;
};

export const getCategoryIcon = (category) => {
  const iconMap = {
    Water: '💧', Electricity: '⚡', Rent: '🏠', Gas: '🔥',
    Other: '📄', Internet: '🌐', Market: '🛒', Food: '🍽️',
  };
  return iconMap[category] || '💰';
};

export const getCategoryColor = (category) => {
  const colorMap = {
    Water: '#3b82f6', Electricity: '#f59e0b', Rent: '#10b981', Gas: '#ef4444',
    Other: '#6b7280', Internet: '#8b5cf6', Market: '#f97316', Food: '#ec4899',
  };
  return colorMap[category] || '#6b7280';
};

export const isBillCategory = (category) =>
  ['Water', 'Electricity', 'Rent', 'Gas', 'Other', 'Internet'].includes(category);

export const isFixedExpense = (category) => ['Rent', 'Internet'].includes(category);
export const isVariableExpense = (category) => ['Water', 'Electricity', 'Gas'].includes(category);

export const getSplitPolicyOptions = (category) =>
  (category === 'Market' || category === 'Food') ? [SplitPolicy.Esit, SplitPolicy.KisiBazli] : [SplitPolicy.Esit];

export const formatAmount = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return '0 ₺';
  return `${num.toFixed(2)} ₺`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Tarih yok';
  try { return new Date(dateString).toLocaleDateString('tr-TR'); }
  catch { return 'Geçersiz tarih'; }
};

// ---- Liste/normalize yardımcıları ----
const textToKey = (text = '') => {
  const t = String(text).toLowerCase();
  if (/(su|water)/.test(t)) return 'Water';
  if (/(elektrik|electricity)/.test(t)) return 'Electricity';
  if (/(kira|rent)/.test(t)) return 'Rent';
  if (/(doğalgaz|dogalgaz|gaz|gas)/.test(t)) return 'Gas';
  if (/internet/.test(t)) return 'Internet';
  if (/(market|alışveriş|alisveris|bakkal|migros|a101|bim)/.test(t)) return 'Market';
  if (/(yemek|food|pizza|burger|kahve|restoran|cafe)/.test(t)) return 'Food';
  return 'Other';
};

export const normalizeExpense = (raw = {}) => {
  const date = raw.kayitTarihi || raw.postDate || raw.date || raw.createdAt || null;
  let key;
  if (raw.category != null) key = CATEGORY_ID_TO_KEY[Number(raw.category)];
  if (!key) key = textToKey(`${raw.tur ?? ''} ${raw.note ?? ''}`);
  const kind = isBillCategory(key) ? 'bill' : 'other';
  return {
    id: raw.id ?? raw.expenseId,
    title: raw.tur || `${getCategoryDisplayName(key)} harcaması`,
    amount: Number(raw.tutar ?? raw.amount ?? 0),
    date,
    payerName: raw.odeyenKullaniciAdi,
    recorderName: raw.kaydedenKullaniciAdi,
    key,   // category key
    kind,  // 'bill' | 'other'
    _raw: raw,
  };
};

export const ymOf = (dateString) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const nowYm = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default {
  ExpenseCategory, SplitPolicy, PaymentMethod, PaymentStatus,
  toExpenseCategory, getCategoryDisplayName, getCategoryIcon,
  isBillCategory, isFixedExpense, isVariableExpense, getSplitPolicyOptions,
  formatAmount, formatDate, normalizeExpense, ymOf, nowYm,
};
