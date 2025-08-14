import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { houseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const DebtsScreen = ({ route, navigation }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [debtInfo, setDebtInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!houseId || !user?.id) {
      Alert.alert('Hata', 'Gerekli bilgiler eksik.');
      return;
    }
    fetchAll();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchAll();
    });

    return unsubscribe;
  }, [houseId, user, navigation]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Üyeleri al (isim eşleştirme için)
      const [membersRes, debtsRes] = await Promise.all([
        houseApi.getMembers(houseId),
        houseApi.getUserDebts(user.id, houseId),
      ]);
      const memBody = membersRes?.data;
      const membersArr = Array.isArray(memBody)
        ? memBody
        : Array.isArray(memBody?.data)
          ? memBody.data
          : [];
      setMembers(membersArr);

      const body = debtsRes?.data;
      const envelope = body?.data ?? body;
      const netBalance = envelope?.netBalance ?? envelope?.netDurum ?? 0;
      const byCounterpart = Array.isArray(envelope?.byCounterpart)
        ? envelope.byCounterpart
        : Array.isArray(envelope?.kullaniciBazliDurumlar)
          ? envelope.kullaniciBazliDurumlar
          : [];

      setDebtInfo({ netBalance, byCounterpart });
    } catch (error) {
      console.error('Borç bilgileri alınamadı:', error);
      setMembers([]);
      setDebtInfo({ netBalance: 0, byCounterpart: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 ₺';
    return `${parseFloat(amount).toFixed(2)} ₺`;
  };

  const getStatusColor = (amount) => {
    if (amount > 0) return Colors.success[600];
    if (amount < 0) return Colors.error[600];
    return Colors.neutral[600];
  };

  const membersMap = useMemo(() => {
    const map = {};
    for (const m of members) {
      const id = m.userId ?? m.id;
      if (id != null) map[String(id)] = m;
    }
    return map;
  }, [members]);

  const rows = useMemo(() => {
    const list = Array.isArray(debtInfo?.byCounterpart) ? debtInfo.byCounterpart : [];
    return list.map((item) => {
      // item.toUserId => ben borçluyum (karşıya borç)
      // item.fromUserId => ben alacaklıyım (karşıdan alacak)
      const counterUserIdRaw = item.toUserId ?? item.fromUserId ?? item.userId ?? item.counterUserId ?? item.karsiUserId ?? item.id;
      const counterUserId = counterUserIdRaw != null ? Number(counterUserIdRaw) : undefined;
      const amount = Number(item.amount ?? 0);
      const type = item.toUserId ? 'debt' : item.fromUserId ? 'receivable' : (amount > 0 ? 'receivable' : 'debt');
      const member = membersMap[String(counterUserId)] ?? {};
      return {
        userId: counterUserId,
        fullName: member.fullName || member.name || `Kullanıcı #${counterUserId}`,
        email: member.email || member.mail || '',
        amount,
        type,
      };
    });
  }, [debtInfo, membersMap]);

  const handleCreatePayment = (row) => {
    if (row.type !== 'debt') return;
    navigation.navigate('CreatePayment', {
      houseId,
      borcluUserId: user.id,
      alacakliUserId: row.userId,
      suggestedAmount: row.amount,
    });
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Borç bilgileri yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Borçlarım</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName} • Toplam borcunuz
          </Text>
        </View>

        {/* Net Durum Kartı */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>💔 Net Durum</Text>
          <View style={styles.netStatusContainer}>
            <Text style={[styles.netAmount, { color: getStatusColor(debtInfo?.netBalance || 0) }]}>
              {formatAmount(debtInfo?.netBalance || 0)}
            </Text>
            <Text style={styles.netLabel}>
              {debtInfo?.netBalance > 0 ? 'Toplam Alacağınız' : 
               debtInfo?.netBalance < 0 ? 'Toplam Borcunuz' : 'Net Durum'}
            </Text>
          </View>
        </View>

        {/* Karşı Kullanıcılar */}
        {rows && rows.length > 0 ? (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>👥 Ev Arkadaşları</Text>
            <View style={CommonStyles.listContainer}>
              {rows.map((row, index) => {
                const statusColor = getStatusColor(row.type === 'debt' ? -1 : 1);
                const statusText = row.type === 'debt' ? 'Borçlu (Öde)' : 'Alacaklı';

                return (
                  <View
                    key={row.userId?.toString() || index.toString()}
                    style={CommonStyles.listItem}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {row.fullName ? row.fullName.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={CommonStyles.listItemContent}>
                      <Text style={CommonStyles.listItemTitle}>
                        {row.fullName || 'İsimsiz Kullanıcı'}
                      </Text>
                      <Text style={CommonStyles.listItemSubtitle}>
                        {row.email || 'Email yok'}
                      </Text>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={[styles.amountText, { color: statusColor }]}>
                        {formatAmount(row.amount)}
                      </Text>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusText}
                      </Text>
                      {row.type === 'debt' ? (
                        <TouchableOpacity
                          onPress={() => handleCreatePayment(row)}
                          style={{ marginTop: 6 }}
                          activeOpacity={0.8}
                        >
                          <Text style={{ color: Colors.primary[600], fontWeight: '600' }}>Ödeme Oluştur</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>💔</Text>
            <Text style={CommonStyles.emptyText}>
              Henüz borç bilginiz bulunmamaktadır.
            </Text>
            <Text style={CommonStyles.emptyText}>
              Harcama ekledikçe borç durumunuz burada görünecektir.
            </Text>
          </View>
        )}

        {/* Detay Butonu */}
        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.navigate('AlacakBorcIcmiScreen', { userId: user.id, houseId })}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
            <Text style={CommonStyles.buttonIcon}>📊</Text>
            <Text style={CommonStyles.buttonText}>Detaylı Görünüm</Text>
            <Text style={CommonStyles.buttonSubtext}>Tüm alacak ve borç detayları</Text>
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
  netStatusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  netAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  netLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DebtsScreen;
