// src/screens/TwoPersonDebtDetailScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { houseApi, paymentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => `${Number(n || 0).toFixed(2)} ₺`;

const TwoPersonDebtDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { houseId, userAId, userBId } = route.params || {}; // userAId ↔ userBId arası borç durumu
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const load = async () => {
    if (!houseId || !userAId || !userBId) return;
    setLoading(true);
    try {
      const res = await houseApi.getUserDebtBetween(Number(houseId), Number(userAId), Number(userBId));
      const data = res?.data?.data ?? res?.data ?? null;
      setSummary(data);
    } catch (e) {
      console.error('İki kişi borç detayı hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [houseId, userAId, userBId]);

  const handlePay = async () => {
    if (!summary) return;
    // Varsayım: "from -> to" borç ilişkisi
    const borcluUserId = Number(summary?.borcluUserId ?? summary?.fromUserId);
    const alacakliUserId = Number(summary?.alacakliUserId ?? summary?.toUserId);
    const tutar = Number(summary?.tutar ?? summary?.amount ?? 0);

    if (!borcluUserId || !alacakliUserId || !tutar) {
      Alert.alert('Hata', 'Ödeme için eksik bilgi.');
      return;
    }

    try {
      const payload = {
        houseId: Number(houseId),
        borcluUserId,
        alacakliUserId,
        tutar,
        paymentMethod: 'Cash',
        note: 'İkili borç kapatma',
      };
      await paymentsApi.create(payload);
      Alert.alert('Başarılı', 'Ödeme kaydı oluşturuldu.');
      navigation.goBack();
    } catch (e) {
      console.error('Ödeme oluşturma hatası:', e);
      Alert.alert('Hata', e?.response?.data?.message || e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Veri bulunamadı.</Text>
      </View>
    );
  }

  const aName = summary?.userAName || summary?.fromUserName || 'Kişi A';
  const bName = summary?.userBName || summary?.toUserName || 'Kişi B';
  const borclu = summary?.borcluUserName || summary?.fromUserName || aName;
  const alacakli = summary?.alacakliUserName || summary?.toUserName || bName;
  const tutar = summary?.tutar ?? summary?.amount ?? 0;

  const iAmDebtor = Number(summary?.borcluUserId ?? summary?.fromUserId) === Number(user?.id);
  const iAmCreditor = Number(summary?.alacakliUserId ?? summary?.toUserId) === Number(user?.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.header}>İkili Borç Detayı</Text>

      <View style={styles.card}>
        <Text style={styles.rowText}><Text style={styles.badge}>A</Text> {aName}</Text>
        <Text style={styles.rowText}><Text style={styles.badge}>B</Text> {bName}</Text>
        <View style={styles.divider} />

        <Text style={styles.line}><Text style={styles.bold}>{borclu}</Text> → <Text style={styles.bold}>{alacakli}</Text></Text>
        <Text style={[styles.amount, { color: iAmCreditor ? '#22c55e' : (iAmDebtor ? '#dc2626' : Colors.text.primary) }]}>
          {iAmCreditor ? '+' : iAmDebtor ? '-' : ''}{fmt(tutar)}
        </Text>
        <Text style={styles.muted}>Toplam net bakiye</Text>

        {iAmDebtor && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handlePay} activeOpacity={0.85}>
            <Text style={styles.btnText}>Bu Borcu Öde</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={load} activeOpacity={0.85}>
        <Text style={[styles.btnText, { color: Colors.primary[600] }]}>Yenile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 16 },
  header: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.text.secondary },

  card: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.neutral[200], marginBottom: 12
  },
  rowText: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  badge: {
    backgroundColor: Colors.primary[500], color: '#fff', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, overflow: 'hidden', marginRight: 6
  },
  divider: { height: 1, backgroundColor: Colors.neutral[200], marginVertical: 10 },
  line: { color: Colors.text.primary, marginBottom: 6 },
  bold: { fontWeight: '800' },
  amount: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  btnPrimary: { backgroundColor: Colors.primary[600] },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: { borderWidth: 1, borderColor: Colors.primary[600], backgroundColor: 'transparent' },
});

export default TwoPersonDebtDetailScreen;
