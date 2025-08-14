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
import { billsApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import Toast from '../components/Toast';

const BillDetailScreen = ({ route, navigation }) => {
  const { billId, houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!billId) {
      showToast('Fatura ID bulunamadı', 'error');
      navigation.goBack();
      return;
    }
    
    fetchBillDetails();
  }, [billId]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      const response = await billsApi.getBillById(billId);
      
      if (response.data) {
        setBill(response.data);
      } else {
        showToast('Fatura detayları alınamadı', 'error');
      }
    } catch (error) {
      console.error('Fatura detayları hatası:', error);
      showToast('Fatura detayları yüklenirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEditBill = () => {
    navigation.navigate('AddBillScreen', {
      billId: billId,
      houseId: houseId,
      houseName: houseName,
      utilityType: bill.utilityType,
      categoryName: getUtilityTypeName(bill.utilityType),
      isEditing: true
    });
  };

  const handleDeleteBill = () => {
    Alert.alert(
      'Faturayı Sil',
      'Bu faturayı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              await billsApi.delete(billId);
              showToast('Fatura başarıyla silindi', 'success');
              navigation.goBack();
            } catch (error) {
              console.error('Fatura silme hatası:', error);
              showToast('Fatura silinirken bir hata oluştu', 'error');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Fatura detayları yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.emptyContainer}>
          <Text style={CommonStyles.emptyIcon}>❌</Text>
          <Text style={CommonStyles.emptyText}>Fatura bulunamadı</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Fatura Detayı</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName} • {getUtilityTypeName(bill.utilityType)}
          </Text>
        </View>

        {/* Fatura Bilgileri */}
        <View style={styles.billInfoContainer}>
          <View style={styles.billHeader}>
            <View style={styles.billIconContainer}>
              <Text style={styles.billIcon}>{getUtilityIcon(bill.utilityType)}</Text>
            </View>
            <View style={styles.billTitleContainer}>
              <Text style={styles.billTitle}>
                {bill.title || `${getUtilityTypeName(bill.utilityType)} Faturası`}
              </Text>
              <Text style={[styles.statusText, { color: bill.isPaid ? Colors.success[600] : Colors.warning[600] }]}>
                {bill.isPaid ? 'Ödendi' : 'Bekliyor'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tutar:</Text>
            <Text style={styles.detailValue}>{formatAmount(bill.amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Son Ödeme Tarihi:</Text>
            <Text style={styles.detailValue}>{formatDate(bill.dueDate)}</Text>
          </View>

          {bill.month && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dönem:</Text>
              <Text style={styles.detailValue}>{bill.month}</Text>
            </View>
          )}

          {bill.responsibleUser && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sorumlu Kişi:</Text>
              <Text style={styles.detailValue}>{bill.responsibleUser.fullName || bill.responsibleUser.name}</Text>
            </View>
          )}

          {bill.note && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Not:</Text>
              <Text style={styles.detailValue}>{bill.note}</Text>
            </View>
          )}

          {bill.createdAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Oluşturulma Tarihi:</Text>
              <Text style={styles.detailValue}>{formatDate(bill.createdAt)}</Text>
            </View>
          )}
        </View>

        {/* İşlem Butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[CommonStyles.menuButton, { flex: 1, marginRight: 8 }]}
            onPress={handleEditBill}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
              <Text style={CommonStyles.buttonIcon}>✏️</Text>
              <Text style={CommonStyles.buttonText}>Düzenle</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[CommonStyles.menuButton, { flex: 1, marginLeft: 8 }]}
            onPress={handleDeleteBill}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.error.background }]}>
              <Text style={CommonStyles.buttonIcon}>🗑️</Text>
              <Text style={CommonStyles.buttonText}>Sil</Text>
            </View>
          </TouchableOpacity>
        </View>

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
  billInfoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  billIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  billIcon: {
    fontSize: 28,
  },
  billTitleContainer: {
    flex: 1,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

export default BillDetailScreen;
