import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useBillsByHouseAndType } from '../features/bills/get-bills/hooks';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import Toast from '../components/Toast';

const BillListScreen = ({ route, navigation }) => {
  const { houseId, houseName, utilityType, categoryName } = route.params || {};
  const { user } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Yeni bills modülü hooks'u kullanıyoruz
  const { data: bills = [], isLoading: loading, error, refetch } = useBillsByHouseAndType(Number(houseId), Number(utilityType));

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!houseId || !utilityType) {
      showToast('Geçerli parametreler bulunamadı', 'error');
      navigation.goBack();
      return;
    }
  }, [houseId, utilityType]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });

    return unsubscribe;
  }, [navigation, refetch]);

  // Hata durumunu kontrol et
  useEffect(() => {
    if (error) {
      console.error('Fatura listesi hatası:', error);
      showToast('Faturalar alınırken bir sorun oluştu', 'error');
    }
  }, [error]);

  const getUtilityTypeName = (type) => {
    const types = {
      1: 'Kira',
      2: 'Elektrik',
      3: 'Su',
      4: 'Doğalgaz',
      5: 'İnternet'
    };
    return types[type] || 'Bilinmeyen';
  };

  const getUtilityIcon = (type) => {
    const icons = {
      1: '🏠',
      2: '⚡',
      3: '💧',
      4: '🔥',
      5: '🌐'
    };
    return icons[type] || '📄';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR');
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 ₺';
    return `${parseFloat(amount).toFixed(2)} ₺`;
  };

  const handleAddBill = () => {
    navigation.navigate('AddBillScreen', {
      houseId: houseId,
      houseName: houseName,
      utilityType: utilityType,
      categoryName: categoryName
    });
  };

  const handleBillPress = (bill) => {
    navigation.navigate('BillDetailScreen', {
      billId: bill.id,
      houseId: houseId,
      houseName: houseName
    });
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Faturalar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>{categoryName} Faturaları</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName} • {bills.length} fatura bulundu
          </Text>
        </View>

        {/* Yeni Fatura Ekle Butonu */}
        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={handleAddBill}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>➕</Text>
            <Text style={CommonStyles.buttonText}>Yeni Fatura Ekle</Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni {categoryName} faturası ekleyin</Text>
          </View>
        </TouchableOpacity>

        {/* Fatura Listesi */}
        {bills.length > 0 ? (
          <View style={[CommonStyles.listContainer]}>
            {(bills || []).map((bill, idx) => (
              <TouchableOpacity
                key={String(bill?.id ?? idx)}
                style={CommonStyles.listItem}
                onPress={() => handleBillPress(bill)}
                activeOpacity={0.8}
              >
                <View style={styles.billIconContainer}>
                  <Text style={styles.billIcon}>{getUtilityIcon(bill.utilityType)}</Text>
                </View>
                <View style={CommonStyles.listItemContent}>
                  <Text style={CommonStyles.listItemTitle}>
                    {bill.title || `${getUtilityTypeName(bill.utilityType)} Faturası`}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Tarih: {formatDate(bill.dueDate)} • Tutar: {formatAmount(bill.amount)}
                  </Text>
                </View>
                <View style={styles.billStatus}>
                  <Text style={[styles.statusText, { color: bill.isPaid ? Colors.success[600] : Colors.warning[600] }]}>
                    {bill.isPaid ? 'Ödendi' : 'Bekliyor'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>📄</Text>
            <Text style={CommonStyles.emptyText}>
              {categoryName} kategorisinde henüz fatura bulunmamaktadır.
            </Text>
            <Text style={CommonStyles.emptyText}>
              İlk faturanızı eklemek için yukarıdaki butona tıklayın.
            </Text>
          </View>
        )}

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  billIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billIcon: {
    fontSize: 24,
  },
  billStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BillListScreen;
