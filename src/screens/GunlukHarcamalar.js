import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActionSheetIOS, Alert, Platform } from 'react-native';
import { useTheme } from '../shared/theme/ThemeProvider';
import { expensesApi } from '../services/api';
import { normalizeExpense, NON_BILL_KEYS } from '../utils/expenseClassifier';
import { getCategoryIcon, getCategoryColor } from '../constants/ExpenseEnums';
import { useAuth } from '../context/AuthContext';

const ExpensesScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { houseId: routeHouseId } = route.params || {};
  const houseId = routeHouseId || user?.defaultHouseId;

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

      const filtered = list.filter(x => {
        const raw = x._raw || {};
        const key = x.key;
        if (!NON_BILL_KEYS.includes(key)) return false;
        const hasParent = raw.parentExpenseId != null || raw.ParentExpenseId != null;
        const isPlannedSignal =
          Number(raw.installmentCount ?? raw.InstallmentCount ?? 0) > 1 ||
          (raw.dueDay ?? raw.DueDay ?? null) != null ||
          (raw.planStartMonth ?? raw.PlanStartMonth ?? raw.startMonth ?? raw.StartMonth ?? null) != null;
        if (hasParent) return false;
        if (isPlannedSignal) return false;
        return true;
      });

      setItems(filtered.sort((a, b) => getItemDate(b) - getItemDate(a)));
    } catch (e) {
    } finally { setLoading(false); }
  };

  useEffect(() => { if (houseId) load(); }, [houseId]);

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
        style={[styles.card, { borderLeftColor: color, backgroundColor: theme.colors.background, borderColor: theme.colors.neutral?.[200] }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('HarcamaDetayi', { expenseId: item.id, houseId })}
      >
        <View style={styles.row}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>{item.title}</Text>
            <Text style={[styles.sub, { color: theme.colors.text.secondary }]}>{item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '-'}</Text>
          </View>
          <Text style={[styles.amount, { color: theme.colors.text.primary }]}>{formatCurrency(item.amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <FlatList
        data={items}
        keyExtractor={(x, i) => String(x.id ?? i)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Harcama Listesi</Text>
            <TouchableOpacity onPress={showHarcamaOptions} activeOpacity={0.85}>
              <Text style={[styles.link, { color: theme.colors.primary?.[600] }]}>+ Yeni Harcama</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: theme.colors.text.secondary }]}>{houseId ? 'Kayıt yok' : 'Lütfen bir ev grubu seçin'}</Text> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 4, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  link: { fontWeight: '800' },

  card: { borderLeftWidth: 4, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 20 },
  title: { fontWeight: '900' },
  sub: {},
  amount: { fontWeight: '900' },
  empty: { textAlign: 'center', padding: 24 },
});

export default ExpensesScreen;
