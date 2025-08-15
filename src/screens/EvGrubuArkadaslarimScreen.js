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
import { houseApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import Toast from '../components/Toast';

const EvGrubuArkadaslarimScreen = ({ route, navigation }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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
    
    fetchMembers();
  }, [houseId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMembers();
    });

    return unsubscribe;
  }, [navigation]);

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
    navigation.navigate('BillListScreen', {
      houseId: houseId,
      houseName: houseName,
      utilityType: utilityType,
      categoryName: categoryName
    });
  };

  const handleAddExpense = () => {
    navigation.navigate('HarcamaEkleScreen', {
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
    
    // İki kişi arası borç/alacak detayına git
    navigation.navigate('TwoPersonDebtDetail', { 
      houseId, 
      houseName,
      currentUserId: user.id,
      selectedUserId: member.id,
      selectedUserName: member.fullName
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
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>{houseName || 'Ev'} - Ev Arkadaşlarım</Text>
          <Text style={CommonStyles.subtitle}>
            {friends.length} üye • Harcama kategorilerini görüntüleyin
          </Text>
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
                      {item.fullName} {isCurrentUser && '(Sen)'}
                    </Text>
                    <Text style={CommonStyles.listItemSubtitle}>{item.email || 'Email yok'}</Text>
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

        {/* Harcama Kategorileri */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>💰 Ev Giderleri ve Harcamalar</Text>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity 
              style={CommonStyles.menuButton}
              onPress={() => navigation.navigate('ChargesList', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
                <Text style={CommonStyles.buttonIcon}>📄</Text>
                <Text style={CommonStyles.buttonText}>Faturalar (Giderler)</Text>
                <Text style={CommonStyles.buttonSubtext}>Aylık kira ve fatura dönemleri</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={CommonStyles.menuButton}
              onPress={() => navigation.navigate('NewRecurringCharge', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
                <Text style={CommonStyles.buttonIcon}>➕</Text>
                <Text style={CommonStyles.buttonText}>Düzenli Gider Ekle</Text>
                <Text style={CommonStyles.buttonSubtext}>Kira/Fatura aboneliği ekle</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={CommonStyles.menuButton}
              onPress={handleAddExpense}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
                <Text style={CommonStyles.buttonIcon}>🧾</Text>
                <Text style={CommonStyles.buttonText}>Harcama Ekle</Text>
                <Text style={CommonStyles.buttonSubtext}>Market vb. tek seferlik</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={CommonStyles.menuButton}
              onPress={() => navigation.navigate('ExpenseListScreen', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
                <Text style={CommonStyles.buttonIcon}>📋</Text>
                <Text style={CommonStyles.buttonText}>Harcamalar</Text>
                <Text style={CommonStyles.buttonSubtext}>Ev içi alışverişler</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={CommonStyles.menuButton}
              onPress={() => navigation.navigate('PendingContributions', { houseId, houseName })}
              activeOpacity={0.8}
            >
              <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
                <Text style={CommonStyles.buttonIcon}>⏳</Text>
                <Text style={CommonStyles.buttonText}>Bekleyen Onaylar</Text>
                <Text style={CommonStyles.buttonSubtext}>Payer için katkı onayları</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alt Butonlar */}
        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => navigation.navigate('ReceivablesScreen', { houseId, houseName })}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
              <Text style={CommonStyles.buttonIcon}>💚</Text>
              <Text style={CommonStyles.buttonText}>Alacaklarım</Text>
              <Text style={CommonStyles.buttonSubtext}>Alacak durumunuz</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => navigation.navigate('DebtsScreen', { houseId, houseName })}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.error.background }]}>
              <Text style={CommonStyles.buttonIcon}>💔</Text>
              <Text style={CommonStyles.buttonText}>Borçlarım</Text>
              <Text style={CommonStyles.buttonSubtext}>Borç durumunuz</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Harcama Özeti Butonu */}
        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.navigate('HouseSpendingOverviewScreen', { houseId, houseName })}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
            <Text style={CommonStyles.buttonIcon}>📊</Text>
            <Text style={CommonStyles.buttonText}>Harcama Özeti</Text>
            <Text style={CommonStyles.buttonSubtext}>Genel harcama durumu</Text>
          </View>
        </TouchableOpacity>

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

export default EvGrubuArkadaslarimScreen;
