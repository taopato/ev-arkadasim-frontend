// src/screens/PaymentApprovalScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { getScrollPosition, setScrollPosition } from '../shared/state/scrollPositions';

// Para formatlaması - Türk Lirası standardı
const fmt = (n) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n || 0));
};

const PaymentApprovalScreen = ({ route }) => {
  const { houseId } = route.params || {};
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingIdSet, setPendingIdSet] = useState(new Set());
  const flatListRef = useRef(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await paymentsApi.getPendingPayments(Number(user.id));
      const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
      // İlgili ev (varsa) ile filtrele
      const filtered = houseId ? arr.filter(x => Number(x?.houseId) === Number(houseId)) : arr;
      setList(filtered);
    } catch (e) {
      console.error('Pending payments load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    load();
    // Odaklanınca önceki scroll pozisyonunu geri yükle
    const key = `PaymentApprovalScreen:${houseId ?? 'all'}`;
    const offset = getScrollPosition(key);
    if (offset && flatListRef.current) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset?.({ offset, animated: false });
      });
    }
  }, [user?.id, houseId]));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const approve = async (paymentId) => {
    // Optimistic: öğeyi listeden çıkar
    const prevList = list;
    setPendingIdSet(new Set([...pendingIdSet, paymentId]));
    setList((curr) => curr.filter((x) => x?.id !== paymentId));
    try {
      await paymentsApi.approvePayment(paymentId);
      // Diğer ekranları güncelle
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      Alert.alert('Onaylandı', 'Ödeme onaylandı.');
    } catch (e) {
      // Rollback
      setList(prevList);
      console.error('approve error', e);
      Alert.alert('Hata', e?.response?.data?.message || e.message);
    } finally {
      setPendingIdSet((s) => {
        const n = new Set(s);
        n.delete(paymentId);
        return n;
      });
    }
  };

  const reject = async (paymentId) => {
    // Optimistic: öğeyi listeden çıkar
    const prevList = list;
    setPendingIdSet(new Set([...pendingIdSet, paymentId]));
    setList((curr) => curr.filter((x) => x?.id !== paymentId));
    try {
      await paymentsApi.rejectPayment(paymentId);
      // Diğer ekranları güncelle
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      Alert.alert('Reddedildi', 'Ödeme reddedildi.');
    } catch (e) {
      // Rollback
      setList(prevList);
      console.error('reject error', e);
      Alert.alert('Hata', e?.response?.data?.message || e.message);
    } finally {
      setPendingIdSet((s) => {
        const n = new Set(s);
        n.delete(paymentId);
        return n;
      });
    }
  };

  const renderItem = ({ item }) => {
    const from = item?.payerUserName || item?.borcluUserName || 'Ödeyen';
    const to = item?.toUserName || item?.alacakliUserName || 'Alacaklı';
    const amount = item?.amount ?? item?.tutar ?? 0;
    const isPending = pendingIdSet.has(item?.id);

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{from} → {to}</Text>
          <Text style={styles.amount}>{fmt(amount)}</Text>
        </View>
        <Text style={styles.sub}>Ödeme onay bekliyor</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnSuccess, isPending && styles.btnDisabled]} onPress={() => !isPending && approve(item?.id)} activeOpacity={0.85} disabled={isPending}>
            <Text style={styles.btnText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnDanger, isPending && styles.btnDisabled]} onPress={() => !isPending && reject(item?.id)} activeOpacity={0.85} disabled={isPending}>
            <Text style={styles.btnText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ödeme Onayları</Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={list}
          keyExtractor={(it, idx) => String(it?.id ?? idx)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={(e) => {
            const key = `PaymentApprovalScreen:${houseId ?? 'all'}`;
            setScrollPosition(key, e.nativeEvent.contentOffset.y || 0);
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={<Text style={styles.empty}>Bekleyen ödeme bulunamadı.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 16 },
  header: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: Colors.text.secondary, marginTop: 24 },

  card: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.neutral[200]
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  sub: { marginTop: 4, color: Colors.text.secondary, fontSize: 12 },
  amount: { fontWeight: '800', color: Colors.text.primary, marginLeft: 8 },

  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnSuccess: { backgroundColor: Colors.success[600] },
  btnDanger: { backgroundColor: Colors.error[600] },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default PaymentApprovalScreen;
