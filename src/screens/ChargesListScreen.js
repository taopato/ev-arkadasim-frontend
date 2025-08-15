import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCharges, useMarkPaid, useSetBill } from '../features/charges/hooks';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import eventBus from '../shared/events/bus';

const formatAmount = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return '0 ₺';
  return `${num.toFixed(2)} ₺`;
};

const getCurrentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const ChargesListScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [period, setPeriod] = useState(getCurrentPeriod());
  const { data: cycles, isLoading, refetch } = useCharges(Number(houseId), period);
  const setBillMutation = useSetBill(Number(houseId), period);
  const markPaidMutation = useMarkPaid(Number(houseId), period);

  const onOpenCreatePayment = (cycle) => {
    const suggested = (() => {
      // per-user share varsa kullan; yoksa eşit böl
      const shares = Array.isArray(cycle?.perUserShares) ? cycle.perUserShares : [];
      const found = shares.find((s) => Number(s.userId) === Number(user?.id));
      if (found) return Number(found.amount);
      const total = Number(cycle?.totalAmount || 0);
      if (!total || !user) return 0;
      return Math.round((total / 100) * 100) / 100; // fallback; kullanıcı düzenler
    })();

    navigation.navigate('CreatePayment', {
      houseId,
      houseName,
      alacakliUserId: cycle?.payerUserId,
      suggestedAmount: suggested,
      chargeId: cycle?.id,
    });
  };

  const onSetBill = async (cycle) => {
    // basit modal yerine prompt alanları: (web uyumlu basit yaklaşım)
    const totalAmount = prompt('Fatura toplam tutarı (örn. 1280.50):', '0');
    if (totalAmount === null) return;
    const url = prompt('Fatura doküman URL (zorunlu):', '');
    if (url === null) return;
    const billDate = prompt('Fatura tarihi ISO (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
    if (billDate === null) return;
    try {
      await setBillMutation.mutateAsync({
        cycleId: cycle.id,
        payload: {
          billDate: new Date(billDate).toISOString(),
          billNumber: undefined,
          billDocumentUrl: url,
          totalAmount: Number(String(totalAmount).replace(',', '.')),
        },
      });
      Alert.alert('Başarılı', 'Fatura kaydedildi');
      eventBus.emit('charges:updated', { houseId });
      refetch();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Fatura kaydedilemedi');
    }
  };

  const onMarkPaid = async (cycle) => {
    const receipt = prompt('Dekont URL (zorunlu):', '');
    if (receipt === null) return;
    try {
      await markPaidMutation.mutateAsync({
        cycleId: cycle.id,
        payload: { paidDate: new Date().toISOString(), externalReceiptUrl: receipt },
      });
      Alert.alert('Başarılı', 'Ödeme dekontu kaydedildi');
      eventBus.emit('charges:updated', { houseId });
      refetch();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'İşlem tamamlanamadı');
    }
  };

  const list = useMemo(() => (Array.isArray(cycles?.data ?? cycles) ? (cycles.data ?? cycles) : []), [cycles]);

  if (isLoading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Giderler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Giderler • {houseName}</Text>
          <Text style={CommonStyles.subtitle}>Dönem: {period}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 8,
                minWidth: 120,
                backgroundColor: Colors.background,
                color: Colors.text.primary,
              }}
              value={period}
              onChangeText={setPeriod}
              placeholder="YYYY-MM"
              autoCapitalize="none"
            />
            <TouchableOpacity style={CommonStyles.menuButton} onPress={() => refetch()} activeOpacity={0.8}>
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
                <Text style={CommonStyles.buttonIcon}>🔁</Text>
                <Text style={CommonStyles.buttonText}>Yenile</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📄 Dönemler</Text>
          <View style={CommonStyles.listContainer}>
            {list.length === 0 && (
              <View style={CommonStyles.emptyContainer}>
                <Text style={CommonStyles.emptyIcon}>📭</Text>
                <Text style={CommonStyles.emptyText}>Bu ay için sözleşme bulunamadı</Text>
              </View>
            )}
            {list.map((c) => {
              const isPayer = Number(user?.id) === Number(c.payerUserId);
              const canPay = (c.status === 'Open' || c.status === 'Collecting') && !isPayer;
              const canSetBill = isPayer && c.amountMode === 'Variable' && c.status === 'AwaitingBill';
              const canMarkPaid = isPayer && (Number(c.fundedAmount || 0) >= Number(c.totalAmount || 0)) && c.status !== 'Paid';
              return (
                <View key={String(c.id)} style={CommonStyles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={CommonStyles.listItemTitle}>{c.type} • {c.period}</Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      Toplam: {formatAmount(c.totalAmount)} • Fon: {formatAmount(c.fundedAmount)} • Durum: {c.status}
                    </Text>
                    {!!c.dueDate && (
                      <Text style={CommonStyles.listItemSubtitle}>Vade: {new Date(c.dueDate).toLocaleDateString('tr-TR')}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {canSetBill && (
                      <TouchableOpacity style={styles.smallBtn} onPress={() => onSetBill(c)} activeOpacity={0.8}>
                        <Text style={styles.smallBtnText}>Fatura Gir</Text>
                      </TouchableOpacity>
                    )}
                    {canPay && (
                      <TouchableOpacity style={styles.smallBtn} onPress={() => onOpenCreatePayment(c)} activeOpacity={0.8}>
                        <Text style={styles.smallBtnText}>Payımı Öde</Text>
                      </TouchableOpacity>
                    )}
                    {canMarkPaid && (
                      <TouchableOpacity style={styles.smallBtn} onPress={() => onMarkPaid(c)} activeOpacity={0.8}>
                        <Text style={styles.smallBtnText}>Dekont Yükle</Text>
                      </TouchableOpacity>
                    )}
                    {c.status === 'Paid' && (
                      <Text style={[styles.statusBadge, { color: Colors.success[700] }]}>Ödendi</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={CommonStyles.menuButton} onPress={() => navigation.navigate('PaymentApproval', { houseId, houseName })} activeOpacity={0.8}>
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
            <Text style={CommonStyles.buttonIcon}>⏳</Text>
            <Text style={CommonStyles.buttonText}>Bekleyen Katkılar</Text>
            <Text style={CommonStyles.buttonSubtext}>Onay bekleyen ödemeleri gör</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  smallBtn: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ChargesListScreen;


