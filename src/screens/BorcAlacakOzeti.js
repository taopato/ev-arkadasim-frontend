// src/screens/DebtSummaryScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { CommonStyles } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';
import { houseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Para formatlaması - Türk Lirası standardı
const fmt = (n) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n || 0));
};

const DebtSummaryScreen = ({ route }) => {
  const { user } = useAuth();
  const { houseId: routeHouseId } = route.params || {};
  const houseId = Number(routeHouseId || user?.defaultHouseId);
  const me = Number(user?.id);

  const [loading, setLoading] = useState(false);
  const [receivables, setReceivables] = useState([]);
  const [debts, setDebts] = useState([]);
  const [totals, setTotals] = useState({ receivable: 0, payable: 0, net: 0 });

  useEffect(() => {
    if (!houseId || !me) return;
    (async () => {
      setLoading(true);
      try {
        const res = await houseApi.getUserDebts(me, houseId);
        const body = res?.data?.data ?? res?.data ?? {};

        // Yeni şema: pairs/totals
        if (Array.isArray(body.pairs) || Array.isArray(body.totals)) {
          const pairs = Array.isArray(body.pairs) ? body.pairs : [];
          const totalsArr = Array.isArray(body.totals) ? body.totals : [];
          const my = totalsArr.find((t) => Number(t.userId) === me) || {};

          // Üye isimlerini al
          let nameById = new Map();
          try {
            const memRes = await houseApi.getMembers(houseId);
            const members = memRes?.data?.data ?? memRes?.data ?? [];
            nameById = new Map(
              members
                .map(m => ({
                  id: Number(m.userId ?? m.user?.id ?? m.id),
                  name: m.fullName ?? m.name ?? m.user?.fullName ?? `Kullanıcı #${m.userId ?? m.id ?? '?'}`
                }))
                .filter(x => Number.isFinite(x.id))
                .map(x => [x.id, x.name])
            );
          } catch (error) {
            console.error('Üye isimleri alınamadı:', error);
          }

          const recv = pairs
            .filter((p) => Number(p.toUserId) === me && Number(p.netAmount) > 0)
            .map((p) => ({
              userId: Number(p.fromUserId),
              name: p.fromUserName || p.fromFullName || p.fromName || nameById.get(Number(p.fromUserId)) || `Kullanıcı #${p.fromUserId}`,
              amount: Number(p.netAmount),
            }));

          const dbt = pairs
            .filter((p) => Number(p.fromUserId) === me && Number(p.netAmount) > 0)
            .map((p) => ({
              userId: Number(p.toUserId),
              name: p.toUserName || p.toFullName || p.toName || nameById.get(Number(p.toUserId)) || `Kullanıcı #${p.toUserId}`,
              amount: Number(p.netAmount),
            }));

          setReceivables(recv);
          setDebts(dbt);
          setTotals({
            receivable: Number(my.receivable) || recv.reduce((s, x) => s + x.amount, 0),
            payable: Number(my.payable) || dbt.reduce((s, x) => s + x.amount, 0),
            net: Number(my.net) || ((Number(my.receivable) || 0) - (Number(my.payable) || 0)),
          });
          return;
        }

        // Eski şema: kullaniciBazliDurumlar/toplamAlacak/toplamBorc/netDurum
        const arr = Array.isArray(body.kullaniciBazliDurumlar) ? body.kullaniciBazliDurumlar : [];
        
        // Üye isimlerini al (eski şema için de)
        let nameById = new Map();
        try {
          const memRes = await houseApi.getMembers(houseId);
          const members = memRes?.data?.data ?? memRes?.data ?? [];
          nameById = new Map(
            members
              .map(m => ({
                id: Number(m.userId ?? m.user?.id ?? m.id),
                name: m.fullName ?? m.name ?? m.user?.fullName ?? `Kullanıcı #${m.userId ?? m.id ?? '?'}`
              }))
              .filter(x => Number.isFinite(x.id))
              .map(x => [x.id, x.name])
          );
        } catch (error) {
          console.error('Üye isimleri alınamadı:', error);
        }
        
        const recv = arr
          .filter((p) => Number(p.amount) < 0)
          .map((p) => ({ 
            userId: Number(p.userId), 
            name: p.userName || p.fullName || nameById.get(Number(p.userId)) || `Kullanıcı #${p.userId}`, 
            amount: Math.abs(Number(p.amount)) 
          }));
        const dbt = arr
          .filter((p) => Number(p.amount) > 0)
          .map((p) => ({ 
            userId: Number(p.userId), 
            name: p.userName || p.fullName || nameById.get(Number(p.userId)) || `Kullanıcı #${p.userId}`, 
            amount: Number(p.amount) 
          }));
        setReceivables(recv);
        setDebts(dbt);
        setTotals({
          receivable: Number(body.toplamAlacak) || recv.reduce((s, x) => s + x.amount, 0),
          payable: Number(body.toplamBorc) || dbt.reduce((s, x) => s + x.amount, 0),
          net: Number(body.netDurum) || (Number(body.toplamAlacak) - Number(body.toplamBorc) || 0),
        });
      } catch (e) {
        setReceivables([]);
        setDebts([]);
        setTotals({ receivable: 0, payable: 0, net: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, [houseId, me]);

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Borç/Alacak özeti yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Borç/Alacak Özeti</Text>
          <Text style={CommonStyles.subtitle}>Ev: {String(houseId)}</Text>
        </View>

        {/* Toplamlar */}
        <View style={CommonStyles.card}>
          <View style={styles.row3}>
            <View style={[styles.kpi, { backgroundColor: Colors.success[50] }]}>
              <Text style={styles.kpiLabel}>Toplam Alacak</Text>
              <Text style={[styles.kpiValue, { color: Colors.success[600] }]}>{fmt(totals.receivable)}</Text>
            </View>
            <View style={[styles.kpi, { backgroundColor: Colors.error[50] }]}>
              <Text style={styles.kpiLabel}>Toplam Borç</Text>
              <Text style={[styles.kpiValue, { color: Colors.error[600] }]}>{fmt(totals.payable)}</Text>
            </View>
            <View style={[styles.kpi, { backgroundColor: Colors.primary[50] }]}>
              <Text style={styles.kpiLabel}>Net</Text>
              <Text
                style={[
                  styles.kpiValue,
                  { color: totals.net >= 0 ? Colors.success[600] : Colors.error[600] },
                ]}
              >
                {fmt(totals.net)}
              </Text>
            </View>
          </View>
        </View>

        {/* Size borçlu olanlar */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📗 Size Borçlu Olanlar</Text>
          {receivables.length ? (
            receivables.map((r) => (
              <View key={String(r.userId)} style={CommonStyles.listItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{r.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={CommonStyles.listItemContent}>
                  <Text style={CommonStyles.listItemTitle}>{r.name}</Text>
                  <Text style={CommonStyles.listItemSubtitle}>Size borçlu</Text>
                </View>
                <Text style={[styles.amount, { color: Colors.success[600] }]}>{fmt(r.amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Kayıt yok</Text>
          )}
        </View>

        {/* Sizin borçlu olduklarınız */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📕 Borçlu Olduklarınız</Text>
          {debts.length ? (
            debts.map((d) => (
              <View key={String(d.userId)} style={CommonStyles.listItem}>
                <View style={[styles.avatar, { backgroundColor: Colors.warning[500] }]}>
                  <Text style={[styles.avatarTxt, { color: '#fff' }]}>{d.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={CommonStyles.listItemContent}>
                  <Text style={CommonStyles.listItemTitle}>{d.name}</Text>
                  <Text style={CommonStyles.listItemSubtitle}>Bu kişiye borçlusunuz</Text>
                </View>
                <Text style={[styles.amount, { color: Colors.error[600] }]}>{fmt(d.amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Kayıt yok</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row3: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  kpiLabel: { color: Colors.text.secondary, fontSize: 12, marginBottom: 6 },
  kpiValue: { fontWeight: '900', fontSize: 16 },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.text.primary, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  amount: { fontWeight: '900' },
  muted: { color: Colors.text.secondary },
});

export default DebtSummaryScreen;
