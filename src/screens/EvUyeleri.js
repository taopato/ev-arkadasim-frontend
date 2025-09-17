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
import useScrollRestore from '../hooks/useScrollRestore';
import { useAuth } from '../context/AuthContext';
import { houseApi, expensesApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import Toast from '../components/Toast';

const HouseMembersScreen = ({ route, navigation }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const { listRef, handleScroll } = useScrollRestore(`HouseMembersScreen:${houseId ?? 'all'}`);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  // KPI verileri
  const [memberCount, setMemberCount] = useState(0);
  const [monthlyBillsTotal, setMonthlyBillsTotal] = useState(0);
  const [netBalance, setNetBalance] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!houseId) {
      showToast('Geçerli bir ev ID\'si bulunamadı', 'error');
      navigation.goBack();
      return;
    }
    
    fetchKPIData();
    fetchMembers();
  }, [houseId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchKPIData();
      fetchMembers();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchKPIData = async () => {
    try {
      // Üye sayısı
      const membersResponse = await houseApi.getMembers(houseId);
      const members = membersResponse.data || [];
      setMemberCount(members.length);
      
      // Bu ayın planlı faturaları
      const expensesResponse = await expensesApi.getByHouse(houseId);
      const expenses = expensesResponse.data?.data || expensesResponse.data || [];
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const monthlyBills = expenses.filter(expense => {
        const expenseDate = new Date(expense.kayitTarihi || expense.postDate || expense.date || expense.createdDate);
        const isChild = expense.parentExpenseId || expense.ParentExpenseId;
        const hasPlanSignals = expense.installmentCount > 1 || expense.dueDay || expense.planStartMonth;
        
        return isChild && 
               expenseDate >= monthStart && 
               expenseDate < monthEnd && 
               expenseDate <= now;
      });
      
      const billsTotal = monthlyBills.reduce((sum, bill) => sum + (Number(bill.tutar) || Number(bill.amount) || 0), 0);
      setMonthlyBillsTotal(billsTotal);
      
      // Net denge (kullanıcının)
      if (user?.id) {
        const debtResponse = await houseApi.getUserDebts(user.id, houseId);
        const debtData = debtResponse.data?.data || debtResponse.data || {};
        
        // Yeni şema kontrolü
        if (debtData.totals && Array.isArray(debtData.totals)) {
          const myTotal = debtData.totals.find(t => Number(t.userId) === Number(user.id));
          setNetBalance(Number(myTotal?.net) || 0);
        } else {
          // Eski şema
          setNetBalance(Number(debtData.netDurum) || 0);
        }
      }
      
    } catch (error) {
      console.error('KPI verileri yüklenirken hata:', error);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const membersResponse = await houseApi.getMembers(houseId);
      
      if (membersResponse.data && Array.isArray(membersResponse.data)) {
        const members = membersResponse.data;
        
        const membersWithDebts = await Promise.all(
          members.map(async (member) => {
            try {
              const userId = member.userId || member.id;
              const debtResponse = await houseApi.getUserDebts(userId, houseId);
              
              const debtData = debtResponse.data;
              const netBalance = debtData.netBalance || 0;
              const pairwise = debtData.pairwise || [];
              
              let debtStatus = 'Nötr';
              if (netBalance > 0) {
                debtStatus = 'Alacaklı';
              } else if (netBalance < 0) {
                debtStatus = 'Borçlu';
              }
              
              return {
                id: userId,
                fullName: member.name || member.fullName || 'İsimsiz Kullanıcı',
                email: member.email,
                debtStatus: debtStatus,
                balance: netBalance,
                pairwise: pairwise
              };
            } catch (error) {
              console.error(`${member.name} için borç/alacak bilgisi alınamadı:`, error);
              return {
                id: member.userId || member.id,
                fullName: member.name || member.fullName || 'İsimsiz Kullanıcı',
                email: member.email,
                debtStatus: 'Nötr',
                balance: 0,
                pairwise: []
              };
            }
          })
        );
        
        setFriends(membersWithDebts);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('API Hatası:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (balance) => {
    if (balance > 0) {
      return `Alacağı: ${balance.toFixed(0)} ₺`;
    } else if (balance < 0) {
      return `Borcu: ${Math.abs(balance).toFixed(0)} ₺`;
    } else {
      return '';
    }
  };

  const getStatusColor = (balance) => {
    if (balance > 0) return Colors.success[600];
    if (balance < 0) return Colors.error[600];
    return Colors.neutral[600];
  };

  const handleCategoryPress = (utilityType, categoryName) => {
    navigation.navigate('FaturaListesi', {
      houseId: houseId,
      houseName: houseName,
      utilityType: utilityType,
      categoryName: categoryName
    });
  };

  const handleAddExpense = () => {
    navigation.navigate('HarcamaEkle', {
      houseId: houseId,
      houseName: houseName
    });
  };

  const handleMemberPress = (member) => {
    // Kendisine tıklamışsa işlem yapma
    if (user && user.id === member.id) {
      showToast('Kendi hesabınızı görüntüleyemezsiniz', 'info');
      return;
    }
    
    // İkili borç/alacak detayına git
    navigation.navigate('AlacakBorcIcmi', { 
      houseId, 
      userId: member.id,
      userName: member.fullName
    });
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Ev arkadaşları yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content} ref={listRef} onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>{houseName || 'Ev'}</Text>
        </View>

        {/* KPI Özet Bloğu */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Üye Sayısı</Text>
              <Text style={styles.kpiValue}>{memberCount}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Bu Ay Faturalar</Text>
              <Text style={styles.kpiValue}>{monthlyBillsTotal.toFixed(0)} ₺</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Net Denge</Text>
              <Text style={[styles.kpiValue, { color: netBalance >= 0 ? Colors.success[600] : Colors.error[600] }]}>
                {netBalance.toFixed(0)} ₺
              </Text>
            </View>
          </View>
        </View>

        {/* Ev Arkadaşları Listesi */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>👥 Ev Arkadaşları</Text>
          <View style={CommonStyles.listContainer}>
            {friends.map((item) => {
              const isCurrentUser = user && user.id === item.id;
              const statusColor = getStatusColor(item.balance);
              const statusText = getStatusText(item.balance);

              return (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={[
                    CommonStyles.listItem,
                    isCurrentUser && styles.currentUserCard
                  ]}
                  onPress={() => handleMemberPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {item.fullName ? item.fullName.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>
                      {item.fullName} {isCurrentUser && '(Siz)'}
                    </Text>
                    <Text style={CommonStyles.listItemSubtitle}>{item.email || 'E-posta yok'}</Text>
                  </View>
                  {statusText ? (
                    <View style={styles.balanceInfo}>
                      <Text style={[styles.balanceText, { color: statusColor }]}>
                        {statusText}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ev Detayı Grid */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>🏠 Ev Detayı</Text>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity 
              style={[CommonStyles.menuButton, { flex: 1, minWidth: '48%' }]}
              onPress={() => navigation.navigate('BillsOverviewScreen', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.primary?.background || Colors.primary[500] }]}>
                <Text style={CommonStyles.buttonIcon}>📄</Text>
                <Text style={CommonStyles.buttonText}>Faturalar (Planlı)</Text>
                <Text style={CommonStyles.buttonSubtext}>Bu ay ödenecekler</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[CommonStyles.menuButton, { flex: 1, minWidth: '48%' }]}
              onPress={() => navigation.navigate('TumHarcamalar', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.info?.background || Colors.info[600] }]}>
                <Text style={CommonStyles.buttonIcon}>📋</Text>
                <Text style={CommonStyles.buttonText}>Harcamalar (Serbest)</Text>
                <Text style={CommonStyles.buttonSubtext}>Tam hareket dökümü</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[CommonStyles.menuButton, { flex: 1, minWidth: '48%' }]}
              onPress={() => navigation.navigate('BekleyenOdemeler', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.warning?.background || Colors.warning[600] }]}>
                <Text style={CommonStyles.buttonIcon}>⏳</Text>
                <Text style={CommonStyles.buttonText}>Bekleyen İşlemler</Text>
                <Text style={CommonStyles.buttonSubtext}>Onay bekleyenler</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[CommonStyles.menuButton, { flex: 1, minWidth: '48%' }]}
              onPress={() => navigation.navigate('DebtSummaryScreen', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.success?.background || Colors.success[600] }]}>
                <Text style={CommonStyles.buttonIcon}>💰</Text>
                <Text style={CommonStyles.buttonText}>Borç–Alacak</Text>
                <Text style={CommonStyles.buttonSubtext}>Net bakiyeler</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[CommonStyles.menuButton, { flex: 1, minWidth: '48%' }]}
              onPress={() => navigation.navigate('HarcamaOzeti', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.primary?.background || Colors.primary[500] }]}>
                <Text style={CommonStyles.buttonIcon}>📊</Text>
                <Text style={CommonStyles.buttonText}>Analitik</Text>
                <Text style={CommonStyles.buttonSubtext}>Grafikler & özetler</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hızlı Ekleme Butonları */}
        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => navigation.navigate('UtilityBillCreate', { houseId, houseName })}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.success?.background || Colors.success[600] }]}>
              <Text style={CommonStyles.buttonIcon}>➕</Text>
              <Text style={CommonStyles.buttonText}>Düzenli Gider Ekle</Text>
              <Text style={CommonStyles.buttonSubtext}>Kira/abonelik ekle</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={handleAddExpense}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes?.neutral?.background || Colors.neutral[200] }]}>
              <Text style={CommonStyles.buttonIcon}>🧾</Text>
              <Text style={CommonStyles.buttonText}>Harcama Ekle</Text>
              <Text style={CommonStyles.buttonSubtext}>Market/Yemek vb.</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  kpiContainer: {
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  currentUserCard: {
    borderWidth: 3,
    borderColor: Colors.primary[500],
  },
  avatarContainer: {
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
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
});

export default HouseMembersScreen;
