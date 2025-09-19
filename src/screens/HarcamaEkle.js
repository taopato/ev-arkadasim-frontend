// AddExpenseScreen.js

import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { houseApi, expensesApi } from "../services/api";
import { useCommonStyles } from "../shared/ui/CommonStyles";
import { useTheme } from "../shared/theme/ThemeProvider";
import Toast from "../components/Toast";
import { toExpenseCategory } from "../constants/ExpenseEnums";

// Binlik ayırıcı ile (kuruşsuz) Türkçe tutar formatı: "1000" -> "1.000"
const formatThousandsTRInput = (text) => {
  if (text == null) return "";
  const digits = String(text).replace(/\D/g, "");
  if (!digits) return "";
  const intStr = digits.replace(/^0+(?=\d)/, "");
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// "1.000" -> 1000 (number)
const parseIntFromTR = (s) => {
  if (!s) return 0;
  const digits = String(s).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

// Bu ekranda sadece fatura DIŞI türler isteniyor
const QUICK_EXPENSES = [
  { key: 'Market', label: 'Market' },
  { key: 'Food',   label: 'Yemek'  },
  { key: 'Other',  label: 'Diğer'  },
];

const AddExpenseScreen = ({ navigation, route }) => {
  const { houseId } = route.params || {};
  const { user } = useAuth();
  const CommonStyles = useCommonStyles();
  const { theme } = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  const [amount, setAmount] = useState('');
  const [categoryKey, setCategoryKey] = useState(''); // Market / Food / Other
  const [note, setNote] = useState('');
  // Not: Taksitli akış Yeni Fatura (NewRecurringChargeScreen) ekranındadır
  const [members, setMembers] = useState([]);
  const [payerId, setPayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [personal, setPersonal] = useState({}); // { userId: '12.5', ... }

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });
  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  useEffect(() => {
    if (!houseId) {
      Alert.alert('Hata', 'Geçerli bir ev bulunamadı.');
      navigation.goBack();
      return;
    }
    fetchMembers();
  }, [houseId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await houseApi.getMembers(houseId);
      const raw = res?.data?.data || res?.data || [];
      const list = (Array.isArray(raw) ? raw : [])
        .map(m => ({
          id: Number(m.userId ?? m.user?.id ?? m.id),
          fullName: m.fullName ?? m.name ?? m.user?.fullName ?? 'Üye',
        }))
        .filter(m => Number.isFinite(m.id));
      setMembers(list);
      const me = list.find(x => x.id === Number(user?.id));
      if (me) setPayerId(String(me.id));
      // kişisel kalemler varsayılan
      const init = {};
      for (const m of list) init[m.id] = '';
      setPersonal(init);
    } catch (e) {
      console.error('Üyeler alınamadı:', e?.response?.data || e?.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseIntFromTR(amount) || 0;

  const save = async () => {
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin.');
      return;
    }
    if (!categoryKey) {
      Alert.alert('Hata', 'Bir kategori seçin (Market, Yemek, Diğer).');
      return;
    }
    if (!payerId) {
      Alert.alert('Hata', 'Ödemeyi yapanı seçin.');
      return;
    }

    // kişisel kalemleri toparla
    let personalTotal = 0;
    const personalItems = [];
    Object.entries(personal).forEach(([uid, val]) => {
      const n = Number(String(val).replace(',', '.')) || 0;
      if (n > 0) {
        personalTotal += n;
        personalItems.push({ userId: Number(uid), amount: n });
      }
    });
    if (personalTotal > amountNum) {
      Alert.alert('Hata', 'Kişisel kalem toplamı, toplam tutardan büyük olamaz.');
      return;
    }

    const catId = toExpenseCategory(categoryKey);
    const payload = {
      tur: QUICK_EXPENSES.find(x => x.key === categoryKey)?.label || 'Harcama',
      Tur: QUICK_EXPENSES.find(x => x.key === categoryKey)?.label || 'Harcama',
      categoryId: catId,
      CategoryId: catId,
      tutar: amountNum,
      houseId: Number(houseId),
      odeyenUserId: Number(payerId),
      kaydedenUserId: Number(user?.id),
      date: new Date().toISOString(),
      postDate: new Date().toISOString(),
      note,
      Aciklama: note,
      aciklama: note,
      // 🔹 create’te de tüm isimlerle gönderelim
      description: note,
      Description: note,
      ortakHarcamaTutari: amountNum,
      sahsiHarcamalar: personalItems,
    };

    try {
      setLoading(true);
      await expensesApi.create(payload);
      try {
        const bus = (await import('../shared/events/bus')).default;
        bus.emit('expenses:updated', { houseId: Number(houseId) });
      } catch {}
      showToast('Harcama kaydedildi!', 'success');
      setTimeout(() => navigation.goBack(), 800);
    } catch (e) {
      console.error('Harcama kaydı hatası:', e?.response?.data || e?.message);
      showToast('Kayıt sırasında bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={CommonStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView style={CommonStyles.content} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="always">
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Ekle</Text>
          <Text style={CommonStyles.subtitle}>Düzensiz harcamalar (Market / Yemek / Diğer)</Text>
        </View>

        {/* Tutar */}
        <View style={styles.card}>
          <Text style={styles.label}>Tutar (₺)</Text>
          <TextInput
            style={styles.input}
            placeholder="1.000"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(formatThousandsTRInput(t))}
          />
          <Text style={styles.hint}>Örn: 1.000</Text>
        </View>

        {/* Kategori (çip seçim) */}
        <View style={styles.card}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.chips}>
            {QUICK_EXPENSES.map(opt => {
              const active = categoryKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategoryKey(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Taksitli akış burada değil, Yeni Fatura ekranındadır */}
        </View>

        {/* Ödeyen kişi */}
        <View style={styles.card}>
          <Text style={styles.label}>Ödeyen</Text>
          <View style={styles.chips}>
            {(members || []).map(m => {
              const active = String(m.id) === String(payerId);
              return (
                <TouchableOpacity
                  key={String(m.id)}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setPayerId(String(m.id))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.fullName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Not */}
        <View style={styles.card}>
          <Text style={styles.label}>Açıklama (opsiyonel)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Short note… (max. 180 characters)"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* Kişisel kalemler */}
        <TouchableOpacity style={styles.toggle} onPress={() => setShowPersonal(v => !v)} activeOpacity={0.8}>
          <Text style={styles.toggleText}>{showPersonal ? '❌ Kişisel kalemleri gizle' : '➕ Kişisel kalem ekle'}</Text>
        </TouchableOpacity>

        {showPersonal && (
          <View style={styles.card}>
            <Text style={styles.label}>Kişisel Kalemler</Text>
            {(members || []).map(m => (
              <View key={String(m.id)} style={styles.personalRow}>
                <Text style={styles.personalName}>{m.fullName}</Text>
                <TextInput
                  style={styles.personalInput}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={personal[String(m.id)] || ''}
                  onChangeText={(v) => setPersonal((p) => ({ ...p, [String(m.id)]: v }))}
                />
              </View>
            ))}
            <Text style={styles.info}>• Kişisel kalemler toplamdan düşülür, kalan tutar eşit bölünür.</Text>
          </View>
        )}

        {/* Kaydet */}
        <TouchableOpacity
          style={[styles.saveBtn, (!amountNum || !categoryKey || !payerId || loading) && { opacity: 0.5 }]}
          onPress={save}
          disabled={!amountNum || !categoryKey || !payerId || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color={theme.colors.text.onPrimary} /> : <Text style={styles.saveText}>Kaydet</Text>}
        </TouchableOpacity>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  card: { backgroundColor: theme.colors.background, padding: 16, borderRadius: 12, marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: theme.colors.background, color: theme.colors.text.primary
  },
  hint: { marginTop: 6, color: theme.colors.text.secondary, fontSize: 12 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 20, backgroundColor: theme.colors.background },
  chipActive: { borderColor: theme.colors.primary[600], backgroundColor: theme.colors.primary[50] },
  chipText: { color: theme.colors.text.primary, fontWeight: '500' },
  chipTextActive: { color: theme.colors.primary[700], fontWeight: '700' },

  toggle: { backgroundColor: theme.colors.primary[100], borderColor: theme.colors.primary[300], borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  toggleText: { color: theme.colors.primary[800], fontWeight: '600' },

  personalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.neutral[200], backgroundColor: theme.colors.background,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  personalName: { fontSize: 15, color: theme.colors.text.primary, flex: 1, marginRight: 10 },
  personalInput: { width: 100, borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, padding: 8, textAlign: 'right' },

  saveBtn: { backgroundColor: theme.colors.success[600], padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 28 },
  saveText: { color: theme.colors.text.onPrimary, fontWeight: '700', fontSize: 16 },

  info: { marginTop: 8, color: theme.colors.text.secondary, fontSize: 12 },
});

export default AddExpenseScreen;
