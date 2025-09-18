// src/utils/expenseClassifier.js

import { getCategoryDisplayName } from '../constants/ExpenseEnums';

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

// Ters eşleme: FE → BE (form gönderimleri için gerekli olabilir)
export const CATEGORY_KEY_TO_ID = Object.fromEntries(
  Object.entries(CATEGORY_ID_TO_KEY).map(([id, key]) => [key, Number(id)])
);

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
  // Backend'den gelen veriyi normalize et

  // Yeni metadata alanları (camelCase ve PascalCase desteği)
  const parentExpenseId = raw?.parentExpenseId ?? raw?.ParentExpenseId ?? null;
  const dueDay = raw?.dueDay ?? raw?.DueDay ?? null;
  const planStartMonth = raw?.planStartMonth ?? raw?.PlanStartMonth ?? null;
  const installmentIndex = raw?.installmentIndex ?? raw?.InstallmentIndex ?? null;
  const installmentCount = raw?.installmentCount ?? raw?.InstallmentCount ?? null;
  
  // Tarih: Backend artık çocuk satırların tarihini doğru ayarlıyor
  const dateStr = raw?.kayitTarihi ?? raw?.KayitTarihi ?? raw?.createdDate ?? raw?.CreatedDate ?? raw?.postDate ?? raw?.PostDate;

  // 1) CategoryId / Category / UtilityType öncelikli
  let key;
  const categoryIdCandidate =
    raw?.categoryId ??
    raw?.CategoryId ??
    (typeof raw?.category === 'number' ? raw?.category : undefined) ??
    (typeof raw?.Category === 'number' ? raw?.Category : undefined);

  if (categoryIdCandidate != null) {
    const mapped = CATEGORY_ID_TO_KEY[Number(categoryIdCandidate)];
    if (mapped) key = mapped;
  }

  if (!key) {
    const categoryNameCandidate =
      (typeof raw?.category === 'string' && raw?.category) ||
      (typeof raw?.Category === 'string' && raw?.Category) ||
      (typeof raw?.utilityType === 'string' && raw?.utilityType) ||
      (typeof raw?.UtilityType === 'string' && raw?.UtilityType) ||
      undefined;
    if (categoryNameCandidate) {
      const lower = String(categoryNameCandidate).toLowerCase();
      // Doğrudan İngilizce enum ismi eşleşmesi
      const direct = Object.keys(CATEGORY_KEY_TO_ID).find(
        (k) => k.toLowerCase() === lower ||
          // BE varyasyonları
          (lower === 'naturalgas' && k === 'Gas')
      );
      if (direct) key = direct;
      else {
        // Türkçe/diğer eşanlamlar → İngilizce anahtara çevir
        if (lower.includes('kira')) key = 'Rent';
        else if (lower.includes('elektrik') || lower.includes('electric') || lower.includes('electricity')) key = 'Electricity';
        else if (lower === 'su' || lower.includes(' water') || lower.includes('su ' ) || lower.includes('water')) key = 'Water';
        else if (lower.includes('doğalgaz') || lower.includes('dogalgaz') || lower.includes('naturalgas') || lower === 'gaz' || lower.includes(' gas')) key = 'Gas';
        else if (lower.includes('internet') || lower.includes('ınternet')) key = 'Internet';
        else if (lower.includes('diğer') || lower.includes('diger') || lower === 'other') key = 'Other';
      }
    }
  }

  // 2) Fallback: Tur / not / type metninden kategoriyi çıkar
  if (!key) {
    const typeText = raw?.type || raw?.Type || '';
    key = textToKey(`${raw?.tur ?? ''} ${raw?.note ?? ''} ${typeText}`);
  }

  // Taksitli planlar ve düzenli giderler "bill" kategorisinde
  const isTaksitli = /taksit|installment/i.test(raw?.tur || '');
  const isDüzenli = /kira|internet|su|elektrik|doğalgaz|dogalgaz/i.test(raw?.tur || '');
  const kind = (BILL_KEYS.includes(key) || isTaksitli || isDüzenli) ? 'bill' : 'other';

  // Tutarı farklı kaynak alanlardan güvenli şekilde çek
  const parseNum = (v) => {
    const n = Number(String(v ?? '').toString().replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const tryKeys = [
    'tutar',
    'amount',
    'fixedAmount',
    'monthlyAmount',
    'aylikTutar',
    'ortakHarcamaTutari',
    'estimatedAmount',
    'amountPerInstallment',
    'Amount',
    'Tutar',
    'FixedAmount',
    'MonthlyAmount',
    'OrtakHarcamaTutari',
    // RecurringCharges için ek alanlar
    'monthlyAmount',
    'estimatedAmount',
    'amountPerMonth',
  ];
  let amount = 0;
  for (const k of tryKeys) {
    if (raw?.[k] != null) {
      amount = parseNum(raw[k]);
      // Amount found in field
      if (amount > 0) break;
    }
  }
  // Taksitli planlar için fallback: totalAmount/installmentCount
  if (amount === 0 && raw?.totalAmount != null && raw?.installmentCount != null) {
    const ta = parseNum(raw.totalAmount);
    const ic = parseNum(raw.installmentCount);
    if (ta > 0 && ic > 0) amount = ta / ic;
    console.log(`💰 Calculated installment amount: ${amount} (${ta}/${ic})`);
  }
  
  // 🔍 DEBUG: Tutar hesaplama
  console.log('💰 AMOUNT DEBUG:', {
    id: raw?.id,
    tur: raw?.tur,
    amount,
    rawAmount: raw?.tutar,
    tryKeys: tryKeys.map(k => ({ key: k, value: raw?.[k] }))
  });

  const result = {
    id: raw?.id ?? raw?.expenseId,
    title: raw?.tur || `${getCategoryDisplayName(key)} harcaması`, // ✅ Doğru başlık
    amount,
    date: dateStr,
    payerName: raw?.odeyenKullaniciAdi,
    recorderName: raw?.kaydedenKullaniciAdi,
    key,   // category key
    kind,  // 'bill' | 'other'
    _raw: { 
      ...raw, 
      parentExpenseId, 
      dueDay, 
      planStartMonth, 
      installmentIndex, 
      installmentCount 
    },
  };

  // 🔍 DEBUG: normalizeExpense sonucu
  console.log('🔍 normalizeExpense result:', {
    id: result.id,
    title: result.title,
    amount: result.amount,
    date: result.date,
    key: result.key,
    kind: result.kind,
    _raw: result._raw
  });
  
  return result;
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
