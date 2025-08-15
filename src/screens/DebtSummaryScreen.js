import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { houseApi } from '../services/api';

const DebtSummaryScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [debtSummary, setDebtSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!houseId) {
      Alert.alert('Hata', 'Ev bilgisi eksik.');
      navigation.goBack();
      return;
    }
    fetchDebtSummary();
  }, [houseId]);

  const fetchDebtSummary = async () => {
    setLoading(true);
    try {
      const response = await houseApi.getUserDebts(user.id, houseId);
      const data = response.data;
      setDebtSummary(data);
    } catch (error) {
      console.error('Borç özeti hatası:', error);
      Alert.alert('Hata', 'Borç özeti alınırken bir sorun oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ₺`;
  };

  const getStatusColor = (balance) => {
    if (balance > 0) return Colors.success[600];
    if (balance < 0) return Colors.error[600];
    return Colors.neutral[600];
  };

  const getStatusText = (balance) => {
    if (balance > 0) return 'Alacaklı';
    if (balance < 0) return 'Borçlu';
    return 'Nötr';
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Borç özeti yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Borç Özeti</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName || 'Ev'} • Genel durum
          </Text>
        </View>

        {debtSummary ? (
          <>
            {/* Genel Durum Kartı */}
            <View style={CommonStyles.card}>
              <Text style={styles.sectionTitle}>💰 Genel Durum</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Net Bakiye</Text>
                  <Text style={[
                    styles.summaryAmount, 
                    { color: getStatusColor(debtSummary.netBalance || 0) }
                  ]}>
                    {formatAmount(debtSummary.netBalance || 0)}
                  </Text>
                  <Text style={[
                    styles.summaryStatus, 
                    { color: getStatusColor(debtSummary.netBalance || 0) }
                  ]}>
                    {getStatusText(debtSummary.netBalance || 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detaylı Liste */}
            {debtSummary.pairwise && debtSummary.pairwise.length > 0 && (
              <View style={CommonStyles.card}>
                <Text style={styles.sectionTitle}>📋 Detaylı Liste</Text>
                <View style={CommonStyles.listContainer}>
                  {debtSummary.pairwise.map((item, index) => (
                    <View key={index} style={CommonStyles.listItem}>
                      <View style={styles.debtIconContainer}>
                        <Text style={styles.debtIcon}>
                          {item.balance > 0 ? '💚' : item.balance < 0 ? '💔' : '⚖️'}
                        </Text>
                      </View>
                      <View style={CommonStyles.listItemContent}>
                        <Text style={CommonStyles.listItemTitle}>
                          {item.otherUserName || 'Bilinmeyen Kullanıcı'}
                        </Text>
                        <Text style={CommonStyles.listItemSubtitle}>
                          Durum: {getStatusText(item.balance)}
                        </Text>
                      </View>
                      <View style={styles.debtAmount}>
                        <Text style={[
                          styles.amountText, 
                          { color: getStatusColor(item.balance) }
                        ]}>
                          {formatAmount(item.balance)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Aksiyon Butonları */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={CommonStyles.menuButton}
                onPress={() => navigation.navigate('HarcamaEkleScreen', { houseId, houseName })}
                activeOpacity={0.8}
              >
                <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
                  <Text style={CommonStyles.buttonIcon}>➕</Text>
                  <Text style={CommonStyles.buttonText}>Harcama Ekle</Text>
                  <Text style={CommonStyles.buttonSubtext}>Yeni harcama kaydı</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={CommonStyles.menuButton}
                onPress={() => navigation.navigate('PaymentApproval', { houseId, houseName })}
                activeOpacity={0.8}
              >
                <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
                  <Text style={CommonStyles.buttonIcon}>⏳</Text>
                  <Text style={CommonStyles.buttonText}>Bekleyen Ödemeler</Text>
                  <Text style={CommonStyles.buttonSubtext}>Onay bekleyen ödemeler</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>📊</Text>
            <Text style={CommonStyles.emptyText}>
              Borç özeti bulunamadı.
            </Text>
            <Text style={CommonStyles.emptyText}>
              Harcama ekleyerek borç/alacak durumunuzu görebilirsiniz.
            </Text>
          </View>
        )}
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
  summaryContainer: {
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  debtIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  debtIcon: {
    fontSize: 24,
  },
  debtAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 12,
  },
});

export default DebtSummaryScreen;
