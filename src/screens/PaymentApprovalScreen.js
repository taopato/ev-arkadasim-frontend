import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const PaymentApprovalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchPendingPayments();
    }
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.id) {
        fetchPendingPayments();
      }
    });

    return unsubscribe;
  }, [navigation, user?.id]);

  const fetchPendingPayments = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsApi.getPendingPayments(user.id);
      if (response.data) {
        setPendingPayments(response.data);
      } else {
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('Bekleyen ödemeler alınamadı:', error);
      setError(error.message);
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const showPaymentDetail = (payment) => {
    setSelectedPayment(payment);
    setModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;

    try {
      setApproveLoading(true);
      const response = await paymentsApi.approvePayment(selectedPayment.id, user.id);
      if (response.data) {
        Alert.alert('Başarılı', 'Ödeme onaylandı');
        setModalVisible(false);
        setSelectedPayment(null);
        fetchPendingPayments();
      } else {
        throw new Error('Ödeme onaylanamadı');
      }
    } catch (error) {
      console.error('Ödeme onaylama hatası:', error);
      Alert.alert('Hata', 'Ödeme onaylanırken bir sorun oluştu: ' + (error.response?.data?.message || error.message));
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    try {
      setRejectLoading(true);
      const response = await paymentsApi.rejectPayment(selectedPayment.id, '');
      if (response.data) {
        Alert.alert('Başarılı', 'Ödeme reddedildi');
        setModalVisible(false);
        setSelectedPayment(null);
        fetchPendingPayments();
      } else {
        throw new Error('Ödeme reddedilemedi');
      }
    } catch (error) {
      console.error('Ödeme reddetme hatası:', error);
      Alert.alert('Hata', 'Ödeme reddedilirken bir sorun oluştu: ' + (error.response?.data?.message || error.message));
    } finally {
      setRejectLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ₺`;
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

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Bekleyen ödemeler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Bekleyen Ödemeler</Text>
          <Text style={CommonStyles.subtitle}>
            Onay bekleyen {pendingPayments.length} ödeme
          </Text>
        </View>

        {pendingPayments.length > 0 ? (
          <View style={CommonStyles.listContainer}>
            {pendingPayments.map((payment) => (
              <TouchableOpacity
                key={payment.id.toString()}
                style={CommonStyles.listItem}
                onPress={() => showPaymentDetail(payment)}
                activeOpacity={0.8}
              >
                <View style={styles.paymentIconContainer}>
                  <Text style={styles.paymentIcon}>💰</Text>
                </View>
                <View style={CommonStyles.listItemContent}>
                  <Text style={CommonStyles.listItemTitle}>
                    {payment.description || 'Ödeme'}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    {payment.fromUser?.fullName || 'Bilinmeyen'} → {payment.toUser?.fullName || 'Bilinmeyen'}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Tarih: {formatDate(payment.createdAt)}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={[styles.amountText, { color: Colors.primary[600] }]}>
                    {formatAmount(payment.amount)}
                  </Text>
                  <Text style={[styles.statusText, { color: Colors.warning[600] }]}>
                    Bekliyor
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>⏳</Text>
            <Text style={CommonStyles.emptyText}>
              Onay bekleyen ödemeniz bulunmamaktadır.
            </Text>
            <Text style={CommonStyles.emptyText}>
              Yeni ödemeler geldiğinde burada görünecektir.
            </Text>
          </View>
        )}

        {/* Ödeme Detay Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ödeme Detayı</Text>
              
              {selectedPayment && (
                <View style={styles.paymentDetails}>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Açıklama:</Text> {selectedPayment.description}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Gönderen:</Text> {selectedPayment.fromUser?.fullName || 'Bilinmeyen'}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Alıcı:</Text> {selectedPayment.toUser?.fullName || 'Bilinmeyen'}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Tutar:</Text> {formatAmount(selectedPayment.amount)}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Tarih:</Text> {formatDate(selectedPayment.createdAt)}
                  </Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.rejectButton]}
                  onPress={handleReject}
                  disabled={rejectLoading}
                >
                  <Text style={styles.rejectButtonText}>
                    {rejectLoading ? 'Reddediliyor...' : 'Reddet'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.approveButton]}
                  onPress={handleApprove}
                  disabled={approveLoading}
                >
                  <Text style={styles.approveButtonText}>
                    {approveLoading ? 'Onaylanıyor...' : 'Onayla'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentAmount: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.text.primary,
  },
  paymentDetails: {
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.text.primary,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: Colors.error[500],
  },
  approveButton: {
    backgroundColor: Colors.success[500],
  },
  rejectButtonText: {
    color: Colors.background,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  approveButtonText: {
    color: Colors.background,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.neutral[300],
  },
  closeButtonText: {
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default PaymentApprovalScreen;
