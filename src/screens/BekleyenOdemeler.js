// src/screens/PendingPaymentsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { paymentsApi } from '../services/api';

const PendingPaymentsScreen = ({ route }) => {
  const { userId } = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await paymentsApi.getPendingPayments(userId);
      const data = res?.data?.data ?? res?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      // basit ekran
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [userId]);

  const doAction = async (id, type) => {
    try {
      setActionId(id);
      if (type === 'approve') {
        await paymentsApi.approve(id);
        Alert.alert('Onaylandı', 'Ödeme onaylandı.');
      } else {
        await paymentsApi.reject(id);
        Alert.alert('Reddedildi', 'Ödeme reddedildi.');
      }
      await load();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'İşlem başarısız');
    } finally { setActionId(null); }
  };

  const renderItem = ({ item }) => {
    const amount = Number(item.tutar ?? item.amount ?? 0);
    const date = item.odemeTarihi || item.date || item.createdAt;
    const fromName = item.borcluUserName || item.payerName || item.borcluKullaniciAdi || '-';
    const toName = item.alacakliUserName || item.toUserName || item.alacakliKullaniciAdi || '-';
    const id = item.id ?? item.paymentId;

    const isBusy = actionId === id;

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{fromName} ➜ {toName}</Text>
        <Text style={styles.sub}>{date ? new Date(date).toLocaleString('tr-TR') : '-'}</Text>
        <Text style={styles.amount}>{amount.toFixed(2)} ₺</Text>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.success[600] }]} onPress={() => doAction(id, 'approve')} activeOpacity={0.85} disabled={isBusy}>
            {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Onayla</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.error[600] }]} onPress={() => doAction(id, 'reject')} activeOpacity={0.85} disabled={isBusy}>
            {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reddet</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(x, i) => String(x.id ?? x.paymentId ?? i)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={<Text style={styles.header}>Bekleyen Ödemeler</Text>}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bekleyen ödeme yok</Text> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { fontSize: 20, fontWeight: '900', color: Colors.text.primary, paddingHorizontal: 12, paddingBottom: 6 },
  card: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 10, borderColor: Colors.neutral[200], borderWidth: 1 },
  title: { fontWeight: '900', color: Colors.text.primary },
  sub: { color: Colors.text.secondary, marginTop: 2 },
  amount: { fontWeight: '900', color: Colors.text.primary, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  empty: { textAlign: 'center', color: Colors.text.secondary, padding: 24 },
});

export default PendingPaymentsScreen;
