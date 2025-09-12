// src/utils/expenseClassifier.js

export const CATEGORY_ID_TO_KEY = {
  0: 'Rent',
  1: 'Internet',
  2: 'Electricity',
  3: 'Water',
  4: 'Gas',
  5: 'Food',
  6: 'Market',
  99: 'Other',
};

// “Fatura” sayfasında gösterilecek anahtarlar
export const BILL_KEYS = ['Water', 'Electricity', 'Rent', 'Gas', 'Internet'];

// “Harcama Listesi”nde gösterilecek anahtarlar
export const NON_BILL_KEYS = ['Market', 'Food', 'Other'];

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

// Tek normalize noktası
export const normalizeExpense = (raw) => {
  const date =
    raw?.kayitTarihi || raw?.postDate || raw?.date || raw?.createdAt || null;

  let key;
  if (raw?.category !== undefined && raw?.category !== null) {
    key = CATEGORY_ID_TO_KEY[Number(raw.category)];
  }
  if (!key) {
    key = textToKey(`${raw?.tur ?? ''} ${raw?.note ?? ''}`);
  }

  const kind = BILL_KEYS.includes(key) ? 'bill' : 'other';

  return {
    id: raw?.id ?? raw?.expenseId,
    title: raw?.tur || `${key} harcaması`,
    amount: Number(raw?.tutar ?? raw?.amount ?? 0),
    date,
    payerName: raw?.odeyenKullaniciAdi,
    recorderName: raw?.kaydedenKullaniciAdi,
    key,   // category key
    kind,  // 'bill' | 'other'
    _raw: raw,
  };
};

// YYYY-MM üret
export const ymOf = (dateString) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const nowYm = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
