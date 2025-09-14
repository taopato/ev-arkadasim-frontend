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
  // Backend'den gelen veriyi normalize et

  // Yeni metadata alanları (camelCase ve PascalCase desteği)
  const parentExpenseId = raw?.parentExpenseId ?? raw?.ParentExpenseId ?? null;
  const dueDay = raw?.dueDay ?? raw?.DueDay ?? null;
  const planStartMonth = raw?.planStartMonth ?? raw?.PlanStartMonth ?? null;
  const installmentIndex = raw?.installmentIndex ?? raw?.InstallmentIndex ?? null;
  const installmentCount = raw?.installmentCount ?? raw?.InstallmentCount ?? null;
  
  // Tarih: Backend artık çocuk satırların tarihini doğru ayarlıyor
  const dateStr = raw?.kayitTarihi ?? raw?.KayitTarihi ?? raw?.createdDate ?? raw?.CreatedDate ?? raw?.postDate ?? raw?.PostDate;

  let key;
  if (raw?.category !== undefined && raw?.category !== null) {
    key = CATEGORY_ID_TO_KEY[Number(raw.category)];
  }
  if (!key) {
    // RecurringCharges için type alanını da kontrol et
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
