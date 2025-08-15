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
import { houseApi, paymentsApi, chargesApi, expensesApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import Toast from '../components/Toast';

const TwoPersonDebtDetailScreen = ({ route, navigation }) => {
  const { houseId, houseName, currentUserId, selectedUserId, selectedUserName } = route.params || {};
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [debtData, setDebtData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedTab, setSelectedTab] = useState('summary'); // 'summary', 'pending', 'completed', 'expenses'
  const [expenseLimit, setExpenseLimit] = useState(5); // 5, 10, 15, 20
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!houseId || !currentUserId || !selectedUserId) {
      showToast('Gerekli parametreler eksik', 'error');
      navigation.goBack();
      return;
    }
    
    fetchData();
  }, [houseId, currentUserId, selectedUserId]);

  useEffect(() => {
    if (selectedTab === 'expenses') {
      fetchExpenses();
    }
  }, [expenseLimit, selectedTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. İki kişi arası borç/alacak durumu
      await fetchDebtData();
      
      // 2. İşlem geçmişi
      await fetchTransactions();
      
      // 3. Harcama detayları
      await fetchExpenses();
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showToast('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDebtData = async () => {
    try {
      // Mevcut GetUserDebts endpoint'ini kullanıp filtreleme yapıyoruz
      const response = await houseApi.getUserDebts(currentUserId, houseId);
      const data = response.data;
      
      console.log('API Response:', data); // Debug için
      
      // Gerçek API yanıtına göre işle
      if (data && data.kullaniciBazliDurumlar && Array.isArray(data.kullaniciBazliDurumlar)) {
        // İki kişi arasındaki veriyi bul
        const userData = data.kullaniciBazliDurumlar.find(u => 
          u.userId === parseInt(selectedUserId) || 
          u.userId === selectedUserId ||
          u.userId === Number(selectedUserId)
        );
        
        console.log('Found user data:', userData); // Debug için
        
        if (userData) {
          const amount = Number(userData.amount || 0);
          setDebtData({
            netAmount: amount,
            direction: amount > 0 ? 'currentUserOwed' : 'selectedUserOwed',
            totalDebt: amount < 0 ? Math.abs(amount) : 0,
            totalReceivable: amount > 0 ? amount : 0
          });
        } else {
          // Eğer kullanıcı verisi bulunamazsa, net durumdan hesapla
          const netDurum = data.netDurum || 0;
          setDebtData({
            netAmount: netDurum,
            direction: netDurum > 0 ? 'currentUserOwed' : 'selectedUserOwed',
            totalDebt: netDurum < 0 ? Math.abs(netDurum) : 0,
            totalReceivable: netDurum > 0 ? netDurum : 0
          });
        }
      } else {
        // API'den veri gelmezse varsayılan değerler
        setDebtData({
          netAmount: 0,
          direction: 'neutral',
          totalDebt: 0,
          totalReceivable: 0
        });
      }
    } catch (error) {
      console.error('Borç verisi alınamadı:', error);
      setDebtData({
        netAmount: 0,
        direction: 'neutral',
        totalDebt: 0,
        totalReceivable: 0
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      // Bekleyen ödemeler
      const pendingResponse = await paymentsApi.getPendingPayments(currentUserId);
      const pendingPayments = pendingResponse.data || [];
      
      // İki kişi arasındaki bekleyen ödemeleri filtrele
      const filteredPending = pendingPayments.filter(payment => 
        (payment.borcluUserId === currentUserId && payment.alacakliUserId === selectedUserId) ||
        (payment.borcluUserId === selectedUserId && payment.alacakliUserId === currentUserId)
      );

      // Tamamlanmış ödemeler (ev bazlı ödemelerden filtreleme)
      const housePaymentsResponse = await paymentsApi.getByHouse(houseId);
      const housePayments = housePaymentsResponse.data || [];
      
      const filteredCompleted = housePayments.filter(payment => 
        payment.status === 'Approved' &&
        ((payment.borcluUserId === currentUserId && payment.alacakliUserId === selectedUserId) ||
         (payment.borcluUserId === selectedUserId && payment.alacakliUserId === currentUserId))
      );

      setTransactions({
        pending: filteredPending,
        completed: filteredCompleted
      });
    } catch (error) {
      console.error('İşlem geçmişi alınamadı:', error);
      setTransactions({ pending: [], completed: [] });
    }
  };

  const fetchExpenses = async () => {
    try {
      // Ev harcamalarını al (Expenses API'sini kullan)
      const expensesResponse = await expensesApi.getByHouse(houseId);
      console.log('Expenses API Response:', expensesResponse); // Debug için
      
      // API yanıtını kontrol et ve array'e çevir
      let allExpenses = [];
      if (expensesResponse && expensesResponse.data) {
        if (Array.isArray(expensesResponse.data)) {
          allExpenses = expensesResponse.data;
        } else if (expensesResponse.data.data && Array.isArray(expensesResponse.data.data)) {
          allExpenses = expensesResponse.data.data;
        } else {
          console.log('Unexpected expenses data structure:', expensesResponse.data);
        }
      }
      
      console.log('Processed expenses:', allExpenses); // Debug için
      
      // İki kişi arasındaki harcamaları filtrele
      const filteredExpenses = allExpenses.filter(expense => 
        expense && expense.odeyenUserId && 
        (expense.odeyenUserId === currentUserId || expense.odeyenUserId === selectedUserId)
      ).slice(0, expenseLimit);

      setExpenses(filteredExpenses);
    } catch (error) {
      console.error('Harcama detayları alınamadı:', error);
      setExpenses([]);
    }
  };

  const getStatusColor = (amount) => {
    if (amount > 0) return Colors.success[600];
    if (amount < 0) return Colors.error[600];
    return Colors.neutral[500];
  };

  const getStatusText = (amount) => {
    if (amount > 0) return `+${amount.toLocaleString('tr-TR')} ₺`;
    if (amount < 0) return `${amount.toLocaleString('tr-TR')} ₺`;
    return '0 ₺';
  };

  const getDirectionText = () => {
    if (!debtData) return '';
    
    if (debtData.direction === 'currentUserOwed') {
      return `${selectedUserName} size borçlu`;
    } else if (debtData.direction === 'selectedUserOwed') {
      return `Siz ${selectedUserName} kişisine borçlusunuz`;
    }
    return 'Hesap dengeli';
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Borç/Alacak detayları yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Borç/Alacak Detayı</Text>
          <Text style={CommonStyles.subtitle}>
            {user?.fullName} ↔ {selectedUserName}
          </Text>
        </View>

        {/* Özet Kartı */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>💰 Finansal Özet</Text>
          
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryItem, { backgroundColor: Colors.success[50] }]}>
              <Text style={[styles.summaryLabel, { color: Colors.success[700] }]}>Toplam Alacak</Text>
              <Text style={[styles.summaryAmount, { color: Colors.success[600] }]}>
                {getStatusText(debtData?.totalReceivable || 0)}
              </Text>
            </View>
            
            <View style={[styles.summaryItem, { backgroundColor: Colors.error[50] }]}>
              <Text style={[styles.summaryLabel, { color: Colors.error[700] }]}>Toplam Borç</Text>
              <Text style={[styles.summaryAmount, { color: Colors.error[600] }]}>
                {getStatusText(debtData?.totalDebt || 0)}
              </Text>
            </View>
            
            <View style={[styles.summaryItem, { backgroundColor: Colors.primary[50] }]}>
              <Text style={[styles.summaryLabel, { color: Colors.primary[700] }]}>Net Durum</Text>
              <Text style={[styles.summaryAmount, { color: getStatusColor(debtData?.netAmount || 0) }]}>
                {getStatusText(debtData?.netAmount || 0)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.directionText}>{getDirectionText()}</Text>
        </View>

        {/* Tab Menüsü */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
            onPress={() => setSelectedTab('pending')}
          >
            <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
              Bekleyen ({transactions.pending?.length || 0})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
            onPress={() => setSelectedTab('completed')}
          >
            <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
              Tamamlanan ({transactions.completed?.length || 0})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'expenses' && styles.activeTab]}
            onPress={() => setSelectedTab('expenses')}
          >
            <Text style={[styles.tabText, selectedTab === 'expenses' && styles.activeTabText]}>
              Harcamalar ({expenses.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab İçerikleri */}
        {selectedTab === 'pending' && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>⏳ Bekleyen İşlemler</Text>
            {transactions.pending?.length > 0 ? (
              transactions.pending.map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionAmount}>
                      {transaction.tutar?.toLocaleString('tr-TR')} ₺
                    </Text>
                    <Text style={styles.transactionStatus}>Bekliyor</Text>
                  </View>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text style={styles.transactionNote}>
                    {transaction.aciklama || 'Açıklama yok'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Bekleyen işlem bulunmuyor</Text>
            )}
          </View>
        )}

        {selectedTab === 'completed' && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>✅ Tamamlanan İşlemler</Text>
            {transactions.completed?.length > 0 ? (
              transactions.completed.map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionAmount}>
                      {transaction.tutar?.toLocaleString('tr-TR')} ₺
                    </Text>
                    <Text style={[styles.transactionStatus, { color: Colors.success[600] }]}>
                      Tamamlandı
                    </Text>
                  </View>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text style={styles.transactionNote}>
                    {transaction.aciklama || 'Açıklama yok'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Tamamlanan işlem bulunmuyor</Text>
            )}
          </View>
        )}

        {selectedTab === 'expenses' && (
          <View style={CommonStyles.card}>
            <View style={styles.expenseHeader}>
              <Text style={styles.sectionTitle}>🧾 Harcama Detayları</Text>
              <View style={styles.limitSelector}>
                <Text style={styles.limitLabel}>Son:</Text>
                <TouchableOpacity 
                  style={[styles.limitButton, expenseLimit === 5 && styles.activeLimitButton]}
                  onPress={() => setExpenseLimit(5)}
                >
                  <Text style={[styles.limitButtonText, expenseLimit === 5 && styles.activeLimitButtonText]}>5</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.limitButton, expenseLimit === 10 && styles.activeLimitButton]}
                  onPress={() => setExpenseLimit(10)}
                >
                  <Text style={[styles.limitButtonText, expenseLimit === 10 && styles.activeLimitButtonText]}>10</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.limitButton, expenseLimit === 15 && styles.activeLimitButton]}
                  onPress={() => setExpenseLimit(15)}
                >
                  <Text style={[styles.limitButtonText, expenseLimit === 15 && styles.activeLimitButtonText]}>15</Text>
                </TouchableOpacity>
              </View>
            </View>
            
                         {expenses.length > 0 ? (
               expenses.map((expense, index) => (
                 <View key={index} style={styles.expenseItem}>
                   <View style={styles.expenseHeader}>
                     <Text style={styles.expenseType}>{expense.tur || 'Bilinmeyen'}</Text>
                     <Text style={styles.expenseAmount}>
                       {expense.tutar?.toLocaleString('tr-TR')} ₺
                     </Text>
                   </View>
                   <Text style={styles.expenseDate}>
                     Tarih: {expense.kayitTarihi && expense.kayitTarihi !== '0001-01-01T00:00:00' ? 
                       new Date(expense.kayitTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                   </Text>
                   <Text style={styles.expensePayer}>
                     Ödeyen: {expense.odeyenKullaniciAdi || (expense.odeyenUserId === currentUserId ? 'Siz' : selectedUserName)}
                   </Text>
                 </View>
               ))
             ) : (
               <Text style={styles.emptyText}>Harcama detayı bulunmuyor</Text>
             )}
          </View>
        )}
      </ScrollView>
      
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  directionText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.background,
    shadowColor: Colors.neutral[400],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  transactionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  transactionStatus: {
    fontSize: 12,
    color: Colors.warning[600],
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  limitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  limitButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: Colors.neutral[200],
  },
  activeLimitButton: {
    backgroundColor: Colors.primary[500],
  },
  limitButtonText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeLimitButtonText: {
    color: Colors.background,
  },
  expenseItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  expenseType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
     expenseDate: {
     fontSize: 12,
     color: Colors.text.secondary,
     marginTop: 4,
   },
  expensePayer: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    padding: 20,
  },
});

export default TwoPersonDebtDetailScreen;
