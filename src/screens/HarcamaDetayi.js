import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { expensesApi, ledgerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HarcamaDetayi = ({ navigation, route }) => {
  const { expenseId: expenseIdParam, billId: billIdParam, houseId, houseName } = route.params || {};
  const expenseId = expenseIdParam ?? billIdParam; // her iki param ismini de destekle
  const { user } = useAuth();

  const [expense, setExpense] = useState(null);
  const [ledgerLines, setLedgerLines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Plan özeti
  const [planStats, setPlanStats] = useState({
    isChild: false,
    parentId: null,
    totalMonths: 0,
    maturedMonths: 0,
    remainingMonths: 0,
    dueDay: null,
    monthlyAmount: 0,
    planStartMonth: null,
    type: null, // "installment" | "recurring" | null
  });

  useEffect(() => {
    if (expenseId) fetchExpenseDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

  const parseDate = (v) => {
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
  };

  const safeDateForUI = (v) => {
    const d = parseDate(v);
    if (!d) return '—';
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
      .format(Number(amount || 0));

  const fetchExpenseDetail = async () => {
    try {
      setLoading(true);

      // Harcama + Ledger paralel
      const [expenseResponse, ledgerResponse] = await Promise.all([
        expensesApi.getById(expenseId),
        ledgerApi.byExpense(expenseId),
      ]);

      const expenseData = expenseResponse?.data?.data || expenseResponse?.data;
      const ledgerData = ledgerResponse?.data?.data || ledgerResponse?.data || [];

      setExpense(expenseData);
      setLedgerLines(Array.isArray(ledgerData) ? ledgerData : []);

      // Plan özeti (kardeşler)
      if (houseId && expenseData) {
        const listRes = await expensesApi.getByHouse(Number(houseId));
        const all = listRes?.data?.data || listRes?.data || [];

        const parentId = expenseData?.parentExpenseId ?? expenseData?.ParentExpenseId ?? null;
        const isChild = parentId != null;

        let siblings = [];
        if (isChild) {
          // Child'a tıklandıysa: aynı parent altındaki tüm çocuklar
          siblings = all.filter(
            (x) => (x?.parentExpenseId ?? x?.ParentExpenseId ?? null) === parentId
          );
        } else {
          // Parent'a tıklandıysa: onun tüm çocukları
          const thisId = expenseData?.id ?? expenseData?.Id;
          siblings = all.filter(
            (x) => (x?.parentExpenseId ?? x?.ParentExpenseId ?? null) === thisId
          );
        }

        // dueDay/planStartMonth child üzerinde taşınıyor
        const dueDay =
          expenseData?.dueDay ?? expenseData?.DueDay ?? null;
        const planStartMonth =
          expenseData?.planStartMonth ?? expenseData?.PlanStartMonth ?? null;

        const now = new Date();
        const matured = siblings.filter((c) => {
          const ds = c?.kayitTarihi || c?.postDate || c?.createdDate || c?.createdAt;
          const d = parseDate(ds);
          return d && d <= now;
        });

        // tür (installment mi?)
        const anyChild = siblings[0] || {};
        const installCount =
          anyChild?.installmentCount ??
          anyChild?.InstallmentCount ??
          expenseData?.installmentCount ??
          expenseData?.InstallmentCount ??
          null;

        const monthlyAmount = Number(
          (expenseData?.ortakHarcamaTutari ?? expenseData?.tutar ?? 0)
        );

        const totalMonths = installCount ? Number(installCount) : siblings.length;
        const maturedMonths = matured.length;
        const remainingMonths = Math.max(0, totalMonths - maturedMonths);

        setPlanStats({
          isChild,
          parentId: isChild ? parentId : (expenseData?.id ?? expenseData?.Id ?? null),
          totalMonths,
          maturedMonths,
          remainingMonths,
          dueDay: dueDay ? Number(dueDay) : null,
          monthlyAmount,
          planStartMonth,
          type: installCount ? 'installment' : (siblings.length > 0 ? 'recurring' : null),
        });
      }
    } catch (error) {
      console.error('❌ Expense detail fetch error:', error);
      Alert.alert('Hata', 'Harcama detayları alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      'Harcamayı Sil',
      'Bu harcamayı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await expensesApi.remove(expenseId);
              Alert.alert('Başarılı', 'Harcama silindi');
              navigation.goBack();
            } catch (error) {
              console.error('❌ Delete expense error:', error);
              Alert.alert('Hata', 'Harcama silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Detayı</Text>
        </View>
        <View style={[CommonStyles.card, { alignItems: 'center', padding: 40 }]}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={{ color: Colors.text.secondary, marginTop: 16 }}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Detayı</Text>
        </View>
        <View style={CommonStyles.card}>
          <Text style={styles.errorText}>Harcama bulunamadı</Text>
        </View>
      </View>
    );
  }

  const titleText = expense?.tur || expense?.category || 'Harcama';

  // Ledger → kullanıcı bazlı özet (kişi başı)
  const userShares = (() => {
    const map = new Map(); // key: fromUserId, val: toplam borç
    (ledgerLines || []).forEach((l) => {
      const uid = Number(l?.fromUserId);
      const amt = Number(l?.amount || 0);
      if (!uid || !amt) return;
      map.set(uid, Number((map.get(uid) || 0) + amt));
    });
    return Array.from(map.entries())
      .map(([uid, total]) => ({ uid, total }))
      .sort((a, b) => b.total - a.total);
  })();

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Detayı</Text>
          <Text style={CommonStyles.subtitle}>{houseName || ''}</Text>
        </View>

        {/* Harcama Bilgileri */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>💰 Harcama Bilgileri</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kategori:</Text>
            <Text style={styles.detailValue}>{titleText}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tutar (kalem):</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              {formatAmount(expense?.tutar ?? expense?.amount ?? 0)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ortak Harcama:</Text>
            <Text style={styles.detailValue}>
              {formatAmount(expense?.ortakHarcamaTutari ?? 0)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tarih:</Text>
            <Text style={styles.detailValue}>
              {safeDateForUI(expense?.postDate || expense?.kayitTarihi || expense?.createdAt || expense?.createdDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ödeyen:</Text>
            <Text style={styles.detailValue}>
              {expense?.odeyenKullaniciAdi || expense?.odeyenUser?.fullName || 'Bilinmiyor'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kaydeden:</Text>
            <Text style={styles.detailValue}>
              {expense?.kaydedenKullaniciAdi || expense?.kaydedenUser?.fullName || 'Bilinmiyor'}
            </Text>
          </View>
        </View>

        {/* Plan Özeti (varsa) */}
        {(planStats?.totalMonths || 0) > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>
              📅 {planStats.type === 'installment' ? 'Taksit Planı Özeti' : 'Düzenli Gider Özeti'}
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Aylık Tutar:</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                {formatAmount(planStats.monthlyAmount)}
              </Text>
            </View>

            {planStats.dueDay ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vade Günü:</Text>
                <Text style={styles.detailValue}>{planStats.dueDay}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Toplam Ay:</Text>
              <Text style={styles.detailValue}>{planStats.totalMonths}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tamamlanan:</Text>
              <Text style={styles.detailValue}>{planStats.maturedMonths}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Kalan:</Text>
              <Text style={styles.detailValue}>{planStats.remainingMonths}</Text>
            </View>
          </View>
        )}

        {/* Kişisel Harcamalar (varsa) */}
        {expense?.sahsiHarcamalar && expense.sahsiHarcamalar.length > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>👥 Kişisel Harcamalar</Text>
            {expense.sahsiHarcamalar.map((item, index) => (
              <View key={index} style={styles.personalItem}>
                <Text style={styles.personalName}>
                  {item?.kullaniciAdi || `Kullanıcı ${item?.userId}`}
                </Text>
                <Text style={styles.personalAmount}>
                  {formatAmount(item?.tutar || item?.amount || 0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Ledger Satırları (Bu kalem için kişi başı paylar) */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📊 Bu Kalem İçin Paylaşım</Text>

          {userShares.length > 0 ? (
            userShares.map((u) => (
              <View key={u.uid} style={styles.ledgerItem}>
                <View style={styles.ledgerInfo}>
                  <Text style={styles.ledgerFrom}>
                    {u.uid === user?.id ? 'Sen' : `Kullanıcı ${u.uid}`}
                  </Text>
                  <Text style={[styles.ledgerArrow, { marginLeft: 6, marginRight: 6 }]}>→</Text>
                  <Text style={styles.ledgerTo}>Ödeyen</Text>
                </View>
                <Text style={styles.ledgerAmount}>{formatAmount(u.total)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>📝 Ledger kaydı yok</Text>
              <Text style={styles.emptySubtext}>Bu kalem için tahakkuk/borç satırı oluşmamış ya da gizli.</Text>
            </View>
          )}
        </View>

        {/* İşlem Butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[CommonStyles.menuButton, { backgroundColor: ColorThemes.error.background }]}
            onPress={handleDeleteExpense}
            activeOpacity={0.8}
          >
            <View style={CommonStyles.buttonContent}>
              <Text style={CommonStyles.buttonIcon}>🗑️</Text>
              <Text style={CommonStyles.buttonText}>Harcamayı Sil</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary[600],
  },
  personalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  personalName: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  personalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary[600],
  },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  ledgerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ledgerFrom: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  ledgerArrow: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  ledgerTo: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary[600],
  },
  actionButtons: { marginTop: 20 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.disabled,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    padding: 20,
  },
});

export default HarcamaDetayi;
