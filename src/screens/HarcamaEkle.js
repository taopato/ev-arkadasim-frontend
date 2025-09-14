import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { houseApi, expensesApi } from "../services/api";
import { CommonStyles } from "../shared/ui/CommonStyles";
import { Colors } from "../constants/Colors";
import Toast from "../components/Toast";
import { toExpenseCategory } from "../constants/ExpenseEnums";

// Bu ekranda sadece fatura DIŞI türler isteniyor
const QUICK_EXPENSES = [
  { key: 'Market', label: 'Market' },
  { key: 'Food',   label: 'Yemek'  },
  { key: 'Other',  label: 'Diğer'  },
];

const AddExpenseScreen = ({ navigation, route }) => {
  const { houseId } = route.params || {};
  const { user } = useAuth();

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

  const amountNum = Number(String(amount).replace(',', '.')) || 0;

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

    const payload = {
      tur: QUICK_EXPENSES.find(x => x.key === categoryKey)?.label || 'Harcama',
      category: toExpenseCategory(categoryKey),
      tutar: amountNum,
      houseId: Number(houseId),
      odeyenUserId: Number(payerId),
      kaydedenUserId: Number(user?.id),
      postDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      note,
      personalItems,
      splitPolicy: 0,
    };

    try {
      setLoading(true);
      await expensesApi.createIrregular(payload);
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
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.hint}>Örn: 350.50</Text>
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

        {/* Taksit alanları bu ekranda yer almaz */}

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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Kaydet</Text>}
        </TouchableOpacity>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.background, padding: 16, borderRadius: 12, marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: Colors.white, color: Colors.text.primary
  },
  hint: { marginTop: 6, color: Colors.text.secondary, fontSize: 12 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 20, backgroundColor: Colors.white },
  chipActive: { borderColor: Colors.primary[600], backgroundColor: Colors.primary[50] },
  chipText: { color: Colors.text.primary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary[700], fontWeight: '700' },

  toggle: { backgroundColor: Colors.primary[100], borderColor: Colors.primary[300], borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  toggleText: { color: Colors.primary[800], fontWeight: '600' },

  personalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.white,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  personalName: { fontSize: 15, color: Colors.text.primary, flex: 1, marginRight: 10 },
  personalInput: { width: 100, borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 8, padding: 8, textAlign: 'right' },

  saveBtn: { backgroundColor: Colors.success[600], padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 28 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  info: { marginTop: 8, color: Colors.text.secondary, fontSize: 12 },
});

export default AddExpenseScreen;
