import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { houseApi } from '../services/api';
import { CommonStyles } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { formatAmount } from '../constants/ExpenseEnums';
import eventBus from '../shared/events/bus';

const pick = (obj, keys) => { for (const k of keys) if (obj && obj[k]) return obj[k]; };
const sum = (arr, sel) => arr.reduce((s, x) => s + Number(sel(x) || 0), 0);

export default function DebtsScreen({ navigation, route }) {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);      // kime borçlusun
  const [totalDebt, setTotalDebt] = useState(0);

  const fetchDebts = useCallback(async () => {
    if (!houseId || !user?.id) return;
    try {
      setLoading(true);

      const me = Number(user.id);
      const res = await houseApi.getUserDebts(me, Number(houseId));
      const body = res?.data?.data ?? res?.data ?? {};
      const pairs = Array.isArray(body.pairs) ? body.pairs : [];
      const totals = Array.isArray(body.totals) ? body.totals : [];

      const hasNames = pairs.some(p =>
        p.counterpartyName ||
        pick(p, ['fromUserName','fromFullName','fromName']) ||
        pick(p, ['toUserName','toFullName','toName'])
      );

      let nameById = new Map();
      if (!hasNames) {
        const memRes = await houseApi.getMembers(Number(houseId));
        const raw = memRes?.data?.data ?? memRes?.data ?? [];
        nameById = new Map(
          raw
            .map(m => ({
              id: Number(m.userId ?? m.user?.id ?? m.id),
              name: m.fullName ?? m.name ?? m.user?.fullName ?? `Kullanıcı #${m.userId ?? m.id ?? '?'}`
            }))
            .filter(x => Number.isFinite(x.id))
            .map(x => [x.id, x.name])
        );
      }

      const myPerspective = pairs
        .map(p => {
          const fromId = Number(p.fromUserId);
          const toId   = Number(p.toUserId);
          const amt    = Number(p.netAmount);
          const mine = fromId === me ? amt : (toId === me ? -amt : 0);
          if (!Number.isFinite(mine) || mine === 0) return null;

          const otherId = fromId === me ? toId : fromId;
          const nameFromApi = p.counterpartyName ||
            (fromId === me
              ? pick(p, ['toUserName','toFullName','toName','toUser','to'])
              : pick(p, ['fromUserName','fromFullName','fromName','fromUser','from']));
          const otherName = nameFromApi || nameById.get(otherId) || `Kullanıcı #${otherId}`;
          return { counterpartyUserId: otherId, counterpartyName: otherName, amount: mine };
        })
        .filter(Boolean);

      const debts = myPerspective.filter(r => r.amount > 0);
      setRows(debts);

      const meTotals = totals.find(t => Number(t.userId) === me) || {};
      const payable = Number(meTotals.payable);
      const fallback = sum(debts, d => d.amount);
      setTotalDebt(Number.isFinite(payable) && payable > 0 ? payable : fallback);
    } catch (error) {
      console.error('🔍 DebtsScreen - Borç bilgisi hatası:', error);
      setRows([]);
      setTotalDebt(0);
    } finally {
      setLoading(false);
    }
  }, [houseId, user?.id]);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', fetchDebts);
    const offBus = eventBus.on('payments:updated', (p) => {
      if (!p?.houseId || Number(p.houseId) === Number(houseId)) fetchDebts();
    });
    return () => { unsubFocus(); offBus(); };
  }, [navigation, fetchDebts, houseId]);

  const getStatusColor = (amount) => amount > 0 ? Colors.error[600] : Colors.neutral[600];

  // --------------------- GÜVENLİ NAVİGASYON ---------------------
  const navigateToCreatePayment = (params) => {
    const candidates = [
      'CreatePaymentScreen',
      'CreatePayment',
      'OdemeYapScreen',
      'OdemeOlusturScreen',
      'PaymentCreate',
      'PaymentScreen',
    ];

    const hasRoute = (nav, name) =>
      !!nav?.getState?.()?.routeNames?.includes?.(name);

    // 1) Bulunduğun navigator
    for (const name of candidates) {
      if (hasRoute(navigation, name)) {
        navigation.navigate(name, params);
        return true;
      }
    }

    // 2) Parent zincirinde ara
    let parent = navigation.getParent?.();
    while (parent) {
      for (const name of candidates) {
        if (hasRoute(parent, name)) {
          parent.navigate(name, params);
          return true;
        }
      }
      parent = parent.getParent?.();
    }

    // 3) Son çare: root dispatch (uyarı gösterebilir)
    navigation.dispatch(CommonActions.navigate({ name: 'OdemeEkle', params }));

    // 4) Yine de bulunamazsa kullanıcıya açık mesaj ver
    const allRoutes =
      navigation.getParent?.()?.getState?.()?.routeNames ??
      navigation.getState?.()?.routeNames ?? [];
    Alert.alert(
      'Ekran bulunamadı',
      `CreatePaymentScreen herhangi bir navigator’da kayıtlı görünmüyor.\nMevcut route'lar: ${allRoutes.join(', ')}`
    );
    return false;
  };

  const goToPay = (item) => {
    const params = {
      houseId,
      houseName,
      alacakliUserId: item.counterpartyUserId,
      suggestedAmount: Number(item.amount),
    };
    navigateToCreatePayment(params);
  };
  // ---------------------------------------------------------------

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Borç bilgileri yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Borçlarım</Text>
          <Text style={CommonStyles.subtitle}>{houseName} • Toplam borcunuz</Text>
        </View>

        {/* Toplam Borç */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>💔 Toplam Borç</Text>
          <View style={styles.netStatusContainer}>
            <Text style={[styles.netAmount, { color: Colors.error[600] }]}>
              {formatAmount(totalDebt)}
            </Text>
            <Text style={styles.netLabel}>Toplam Borcunuz</Text>
          </View>
        </View>

        {/* Kime borçlusunuz? */}
        {rows.length > 0 ? (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>👥 Borçlu Olduğunuz Kişiler</Text>
            <View style={CommonStyles.listContainer}>
              {rows.map((item, idx) => {
                const statusColor = getStatusColor(item.amount);
                return (
                  <View key={item.counterpartyUserId?.toString() || idx.toString()} style={CommonStyles.listItem}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', flex: 1 }}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate('TwoPersonDebtDetail', {
                          houseId,
                          userAId: Number(user.id),
                          userBId: item.counterpartyUserId,
                          userAName: user.fullName || user.name || `Kullanıcı #${user.id}`,
                          userBName: item.counterpartyName,
                        })
                      }
                    >
                      <View style={styles.userAvatar}>
                        <Text style={styles.avatarText}>
                          {item.counterpartyName ? item.counterpartyName.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                      <View style={CommonStyles.listItemContent}>
                        <Text style={CommonStyles.listItemTitle}>{item.counterpartyName}</Text>
                        <Text style={CommonStyles.listItemSubtitle}>Bu kişiye borçlusunuz</Text>
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={[styles.amountText, { color: statusColor }]}>
                          {formatAmount(item.amount)}
                        </Text>
                        <Text style={[styles.statusText, { color: statusColor }]}>Borçlu</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.payBtn} onPress={() => goToPay(item)} activeOpacity={0.85}>
                      <Text style={styles.payBtnText}>Öde</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>💔</Text>
            <Text style={CommonStyles.emptyText}>Kime borçlu olduğunuz bulunamadı.</Text>
            <Text style={CommonStyles.emptyText}>Harcama ekledikçe borçlar burada listelenir.</Text>
          </View>
        )}

        {/* Detay butonu */}
        <TouchableOpacity
          style={CommonStyles.menuButton}
          onPress={() => navigation.navigate('Ozet', { userId: user.id, houseId })}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: Colors.primary[500] }]}>
            <Text style={CommonStyles.buttonIcon}>📊</Text>
            <Text style={CommonStyles.buttonText}>Detaylı Görünüm</Text>
            <Text style={CommonStyles.buttonSubtext}>Tüm alacak ve borç detayları</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: Colors.text.primary },
  netStatusContainer: { alignItems: 'center', paddingVertical: 20 },
  netAmount: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  netLabel: { fontSize: 16, color: Colors.text.secondary },
  userAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary[500],
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: Colors.background },
  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  payBtn: {
    marginLeft: 10, alignSelf: 'center', backgroundColor: Colors.primary[500],
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
  },
  payBtnText: { color: '#fff', fontWeight: '700' },
});
