// src/screens/PendingContributionsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../services/api';
import { CommonStyles } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';

const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const fmt = (n) =>
  `${safeNum(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

export default function PendingContributionsScreen({ navigation, route }) {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const normalize = (arr) =>
    (arr || []).map((p) => ({
      id: Number(p.id ?? p.paymentId),
      houseId: Number(p.houseId ?? houseId),
      debtorId: Number(p.borcluUserId ?? p.payerUserId ?? p.debtorUserId),
      debtorName: p.borcluUserName ?? p.payerName ?? p.debtorName ?? `Kullanıcı #${p.borcluUserId ?? p.payerUserId ?? ''}`,
      creditorId: Number(p.alacakliUserId ?? p.toUserId ?? p.creditorUserId),
      creditorName: p.alacakliUserName ?? p.toUserName ?? p.creditorName ?? '',
      amount: p.tutar ?? p.amount ?? 0,
      method: p.paymentMethod ?? p.method ?? '-',
      note: p.aciklama ?? p.note ?? '',
      createdAt: p.createdAt ?? p.odemeTarihi ?? p.date ?? null,
      type: p.type ?? p.chargeType ?? '',
      period: p.period ?? p.donem ?? '',
    }));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getPendingPayments(Number(user.id));
      const body = res?.data?.data ?? res?.data ?? [];
      setList(normalize(Array.isArray(body) ? body : []));
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const approve = async (p) => {
    try {
      await paymentsApi.approve(p.id);
      Alert.alert('Başarılı', 'Ödeme onaylandı');
      load();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Onaylanamadı');
    }
  };
  const reject = async (p) => {
    try {
      await paymentsApi.reject(p.id);
      Alert.alert('Bilgi', 'Ödeme reddedildi');
      load();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Reddedilemedi');
    }
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Bekleyen katkılar yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Bekleyen Katkılar</Text>
          <Text style={CommonStyles.subtitle}>{houseName || ''}</Text>
        </View>

        {list.length === 0 ? (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>📭</Text>
            <Text style={CommonStyles.emptyText}>Bekleyen katkı yok</Text>
          </View>
        ) : (
          <View style={CommonStyles.listContainer}>
            {list.map((p) => (
              <View key={String(p.id)} style={CommonStyles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={CommonStyles.listItemTitle}>{p.debtorName} → {p.creditorName || 'Siz'}</Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    {p.type || 'Ödeme'} {p.period ? `• ${p.period}` : ''}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Tutar: {fmt(p.amount)} • Yöntem: {p.method}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => approve(p)} activeOpacity={0.8}>
                    <Text style={styles.smallBtnText}>Onayla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: Colors.error[500] }]} onPress={() => reject(p)} activeOpacity={0.8}>
                    <Text style={styles.smallBtnText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  smallBtn: { backgroundColor: Colors.primary[500], paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: '600' },
});
