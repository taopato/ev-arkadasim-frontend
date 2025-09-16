// Ortak utility fonksiyonları - 3 ana ekran için
import { NON_BILL_KEYS } from './expenseClassifier';
import { getCategoryDisplayName, getCategoryIcon, getCategoryColor } from '../constants/ExpenseEnums';

// ==== UTC Ay Penceresi Hesaplama ====
export const getUTCMonthWindow = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  
  const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  
  return { monthStart, monthEnd };
};

// ==== Para Formatı ====
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
};

// ==== Tarih Formatı ====
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// ==== Kayıt Tarihi Okuma ====
export const getItemDate = (item) => {
  const raw = item?._raw || {};
  const date = item?.date || raw.kayitTarihi || raw.postDate || raw.createdDate || 
               raw.KayitTarihi || raw.PostDate || raw.CreatedDate;
  return new Date(date || 0);
};

// ==== Açıklama Okuma (Fallback Zinciri) ====
export const getItemNote = (item) => {
  const raw = item?._raw || {};
  return item?.note ?? item?.Note ?? item?.description ?? item?.Description ?? 
         raw?.note ?? raw?.Note ?? raw?.aciklama ?? raw?.Aciklama ?? 
         raw?.description ?? raw?.Description ?? '—';
};

// ==== Plan Türü Tespiti ====
export const getPlanType = (item) => {
  const raw = item?._raw || {};
  const installmentCount = Number(raw.installmentCount ?? raw.InstallmentCount ?? 0);
  const hasDueDay = (raw.dueDay ?? raw.DueDay ?? null) != null;
  const hasPlanStart = (raw.planStartMonth ?? raw.PlanStartMonth ?? raw.startMonth ?? raw.StartMonth ?? null) != null;
  
  if (installmentCount > 1) return 'installment';
  if (hasDueDay || hasPlanStart) return 'recurring';
  return 'irregular';
};

// ==== Parent/Child Tespiti ====
export const isChildExpense = (item) => {
  const raw = item?._raw || {};
  return (raw.parentExpenseId ?? raw.ParentExpenseId ?? null) != null;
};

export const isParentExpense = (item) => {
  const raw = item?._raw || {};
  return (raw.parentExpenseId ?? raw.ParentExpenseId ?? null) == null && 
         (getPlanType(item) === 'recurring' || getPlanType(item) === 'installment');
};

// ==== Utility Key Tespiti ====
export const isUtilityKey = (key) => !NON_BILL_KEYS.includes(key);

// ==== Deduplikasyon: Ayda Plan Başına Tek Çocuk ====
export const deduplicateMonthlyPlans = (items) => {
  const seen = new Set();
  const result = [];
  
  for (const item of items) {
    const raw = item._raw || {};
    const parentId = raw.parentExpenseId ?? raw.ParentExpenseId;
    const date = getItemDate(item);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    
    // Parent kayıtları hiç ekleme
    if (isParentExpense(item)) continue;
    
    // Child kayıtları için deduplikasyon
    if (parentId != null) {
      const key = `${parentId}-${year}-${month}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    
    result.push(item);
  }
  
  return result;
};

// ==== Filtreleme: Bu Ay + Bugün/Öncesi ====
export const filterCurrentMonthPast = (items) => {
  const { monthStart, monthEnd } = getUTCMonthWindow();
  const now = new Date();
  
  return items.filter(item => {
    const date = getItemDate(item);
    
    // Bu ay içinde mi?
    if (!(date >= monthStart && date < monthEnd)) return false;
    
    // Bugün veya öncesi mi?
    if (date > now) return false;
    
    return true;
  });
};

// ==== Sıralama: Tarih DESC, ID DESC ====
export const sortByDateDesc = (items) => {
  return [...items].sort((a, b) => {
    const dateA = getItemDate(a);
    const dateB = getItemDate(b);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    
    return (b.id ?? 0) - (a.id ?? 0);
  });
};

// ==== Badge/Etiket Sistemi ====
export const getStatusBadges = (item) => {
  const badges = [];
  const raw = item._raw || {};
  const date = getItemDate(item);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Taksit bilgisi
  const installmentCount = Number(raw.installmentCount ?? raw.InstallmentCount ?? 0);
  const installmentNumber = Number(raw.installmentNumber ?? raw.InstallmentNumber ?? 0);
  if (installmentCount > 1 && installmentNumber > 0) {
    badges.push({ text: `Taksit ${installmentNumber}/${installmentCount}`, type: 'info' });
  }
  
  // Tarih durumu
  if (itemDate < today) {
    badges.push({ text: 'Gecikmiş', type: 'error' });
  } else if (itemDate.getTime() === today.getTime()) {
    badges.push({ text: 'Bugün', type: 'warning' });
  }
  
  // Vade günü
  const dueDay = raw.dueDay ?? raw.DueDay;
  if (dueDay != null) {
    badges.push({ text: `Vade: ${dueDay}`, type: 'neutral' });
  }
  
  // Ödeme durumu (varsa)
  const isPaid = raw.isPaid ?? raw.IsPaid ?? raw.status === 'paid' ?? raw.Status === 'Paid';
  if (isPaid !== undefined) {
    badges.push({ 
      text: isPaid ? 'Ödendi' : 'Ödenmedi', 
      type: isPaid ? 'success' : 'warning' 
    });
  }
  
  return badges;
};

// ==== Kategori Meta Bilgileri ====
export const UTILITY_META = {
  Electricity: { label: 'Elektrik', icon: '⚡', color: '#FFD700' },
  Water: { label: 'Su', icon: '💧', color: '#00BFFF' },
  Gas: { label: 'Doğalgaz', icon: '🔥', color: '#FF6347' },
  Internet: { label: 'İnternet', icon: '🌐', color: '#9370DB' },
  Rent: { label: 'Kira', icon: '🏠', color: '#32CD32' },
  Other: { label: 'Diğer', icon: '📄', color: '#808080' },
};

export const getUtilityMeta = (key) => {
  return UTILITY_META[key] || UTILITY_META.Other;
};

// ==== Toplam Hesaplama ====
export const calculateTotals = (items) => {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const count = items.length;
  
  return { total, count };
};

// ==== Ledger Durumu (Kullanıcı Bazlı) ====
export const getUserLedgerStatus = (item, userId) => {
  // Bu fonksiyon ledger API'sinden gelen verilerle çalışacak
  // Şimdilik placeholder
  return {
    isDebtor: false,    // Ben borçluyum
    isCreditor: false,  // Ben alacaklıyım
    amount: 0,          // Borç/alacak miktarı
    status: 'neutral'   // neutral, debtor, creditor
  };
};

// ==== Kategori Yardımcı Fonksiyonları ====
// Bu fonksiyonlar ExpenseEnums.js'den import ediliyor ve re-export ediliyor
export { getCategoryDisplayName, getCategoryIcon, getCategoryColor };