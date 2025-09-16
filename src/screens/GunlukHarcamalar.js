import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActionSheetIOS, Alert, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { expensesApi } from '../services/api';
import { normalizeExpense, NON_BILL_KEYS } from '../utils/expenseClassifier';
import { getCategoryIcon, getCategoryColor } from '../constants/ExpenseEnums';
import { useAuth } from '../context/AuthContext';

const ExpensesScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { houseId: routeHouseId } = route.params || {};
  const houseId = routeHouseId || user?.defaultHouseId;

  // Para formatlaması - Türk Lirası standardı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Yardımcı: kayıt tarihini oku
  const getItemDate = (x) => {
    const r = x?._raw || {};
    const v = x?.date || r.kayitTarihi || r.postDate || r.createdDate || x?.kayitTarihi || x?.postDate || x?.createdDate;
    return new Date(v || 0);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.getByHouse(houseId);
      const data = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(data) ? data.map(normalizeExpense) : [];

      // 🔹 Günlük harcamalar: sadece NON_BILL_KEYS (Market, Food, Other)
      // 🔹 Plan öğelerini tamamen dışla: parent çocukları ve plan sinyali olan single kayıtlar
      const filtered = list.filter(x => {
        const raw = x._raw || {};
        const key = x.key; // normalizeExpense key
        // yalnız günlük türler
        if (!NON_BILL_KEYS.includes(key)) return false;

        // plan/child tespiti
        const hasParent = raw.parentExpenseId != null || raw.ParentExpenseId != null;
        const isPlannedSignal =
          Number(raw.installmentCount ?? raw.InstallmentCount ?? 0) > 1 ||
          (raw.dueDay ?? raw.DueDay ?? null) != null ||
          (raw.planStartMonth ?? raw.PlanStartMonth ?? raw.startMonth ?? raw.StartMonth ?? null) != null;

        if (hasParent) return false;       // planın çocuğuysa gösterme
        if (isPlannedSignal) return false; // plan sinyali taşıyorsa (tekil olsa da) gösterme

        return true;
      });

      setItems(filtered.sort((a, b) => getItemDate(b) - getItemDate(a)));
    } catch (e) {
      // noop
    } finally { setLoading(false); }
  };

  useEffect(() => { if (houseId) load(); }, [houseId]);

  // Yeni harcama türü seçimi
  const showHarcamaOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({
        options: ['İptal', 'Günlük Harcama', 'Düzenli Gider'],
        cancelButtonIndex: 0,
        title: 'Yeni Harcama Türü Seçin'
      }, (buttonIndex) => {
        if (buttonIndex === 1) {
          navigation.navigate('HarcamaEkle', { houseId, houseName: 'Ev' });
        } else if (buttonIndex === 2) {
          navigation.navigate('DuzenliGiderEkle', { houseId, houseName: 'Ev' });
        }
      });
    } else {
      // Android için Alert
      Alert.alert(
        'Yeni Harcama Türü Seçin',
        'Hangi tür harcama eklemek istiyorsunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Günlük Harcama', onPress: () => navigation.navigate('HarcamaEkle', { houseId, houseName: 'Ev' }) },
          { text: 'Düzenli Gider', onPress: () => navigation.navigate('DuzenliGiderEkle', { houseId, houseName: 'Ev' }) }
        ]
      );
    }
  };

  const renderItem = ({ item }) => {
    const color = getCategoryColor(item.key);
    const icon = getCategoryIcon(item.key);
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('HarcamaDetayi', { expenseId: item.id, houseId })}
      >
        <View style={styles.row}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '-'}</Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(x, i) => String(x.id ?? i)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Harcama Listesi</Text>
            <TouchableOpacity onPress={showHarcamaOptions} activeOpacity={0.85}>
              <Text style={styles.link}>+ Yeni Harcama</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{houseId ? 'Kayıt yok' : 'Lütfen bir ev grubu seçin'}</Text> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 4, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text.primary },
  link: { color: Colors.primary[600], fontWeight: '800' },

  card: { borderLeftWidth: 4, backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 10, borderColor: Colors.neutral[200], borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 20 },
  title: { fontWeight: '900', color: Colors.text.primary },
  sub: { color: Colors.text.secondary },
  amount: { fontWeight: '900', color: Colors.text.primary },
  empty: { textAlign: 'center', color: Colors.text.secondary, padding: 24 },
});

export default ExpensesScreen;
