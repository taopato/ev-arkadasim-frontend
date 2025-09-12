// src/screens/ExpensesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { expensesApi } from '../services/api';
import { normalizeExpense } from '../utils/expenseClassifier';
import { getCategoryIcon, getCategoryColor } from '../constants/ExpenseEnums';
import { useAuth } from '../context/AuthContext';

const ExpensesScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { houseId: routeHouseId } = route.params || {};
  const houseId = routeHouseId || user?.defaultHouseId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.getByHouse(houseId);
      const data = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(data) ? data.map(normalizeExpense) : [];
      setItems(list.sort((a, b) => (new Date(b.date) - new Date(a.date))));
    } catch (e) {
      // noop: basit ekran
    } finally { setLoading(false); }
  };

  useEffect(() => { if (houseId) load(); }, [houseId]);

  const renderItem = ({ item }) => {
    const color = getCategoryColor(item.key);
    const icon = getCategoryIcon(item.key);
    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.row}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '-'}</Text>
          </View>
          <Text style={styles.amount}>{item.amount.toFixed(2)} ₺</Text>
        </View>
      </View>
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
            <TouchableOpacity onPress={() => navigation.navigate('UtilityBillCreate', { houseId, houseName: 'Ev', isEditing: false })} activeOpacity={0.85}>
              <Text style={styles.link}>+ Yeni Fatura</Text>
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
