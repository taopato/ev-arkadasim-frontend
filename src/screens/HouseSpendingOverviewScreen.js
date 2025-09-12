import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { houseApi, expensesApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';
import { getCategoryDisplayName, getCategoryIcon, formatAmount, formatDate } from '../constants/ExpenseEnums';
import { getCategoryColorUI } from '../constants/ExpenseUI';

// Helper functions
const getMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const getMonthEnd = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
};

// formatAmount artık constants/ExpenseEnums.ts'den import ediliyor

// getCategoryDisplayName artık constants/ExpenseEnums.ts'den import ediliyor

const HouseSpendingOverviewScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    console.log('🔍 Sayfa Açıldı: Ev Harcama Özeti Ekranı (GetExpenses API)');
    console.log('📍 Ev ID:', houseId, 'Ev Adı:', houseName);
    
    if (!houseId) {
      Alert.alert('Hata', 'Ev bilgisi eksik.');
      navigation.goBack();
      return;
    }
    fetchOverview();
  }, [houseId]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      // Paralel olarak tüm verileri çek - Expense merkezli yaklaşım
      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-09" formatında
      const [membersRes, expensesRes] = await Promise.all([
        houseApi.getMembers(houseId),
        expensesApi.getExpenses(houseId, currentMonth) // GET /api/Expenses/GetExpenses - Ay bazlı
      ]);

      console.log('🔍 HouseSpendingOverview API Responses:', {
        members: membersRes.data,
        expenses: expensesRes.data,
        expensesShape: typeof expensesRes.data,
        expensesDataLength: expensesRes.data?.data?.length || 0
      });

      // Flexible parsing for GetExpenses response as specified by user
      let expensesData = [];
      if (expensesRes.data && expensesRes.data.isSuccess && Array.isArray(expensesRes.data.data)) {
        // Yeni yapı: {isSuccess: true, data: Array}
        expensesData = expensesRes.data.data;
      } else if (Array.isArray(expensesRes.data)) {
        // Eski yapı: direkt Array
        expensesData = expensesRes.data;
      } else if (expensesRes.data && Array.isArray(expensesRes.data.data)) {
        // Backend'den gelen format: { data: [...] }
        expensesData = expensesRes.data.data;
      } else {
        // Fallback: boş array
        expensesData = [];
      }

      setMembers(membersRes.data || []);
      setExpenses(expensesData);
      setBills([]); // Bills artık kullanılmıyor, tüm veriler expenses'den geliyor
      
      const totalExpenses = expensesData.reduce((sum, exp) => sum + Number(exp.tutar || 0), 0);
      
      // Kategori bazlı hesaplama - API dokümantasyonuna göre string kategoriler
      const billCategories = ['Water', 'Electricity', 'Rent', 'Gas', 'Other', 'Internet'];
      const totalBills = expensesData.reduce((sum, exp) => {
        const category = exp.category || exp.tur;
        return billCategories.includes(category) ? sum + Number(exp.tutar || 0) : sum;
      }, 0);
      
      setOverview({
        totalSpending: totalExpenses,
        totalExpenses,
        totalBills,
        memberCount: (membersRes.data || []).length,
        expenseCount: expensesData.length,
        billCount: 0 // Bills artık ayrı değil, expense içinde
      });

    } catch (error) {
      console.error('🔍 HouseSpendingOverview hatası:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      Alert.alert('Hata', 'Harcama özeti alınırken bir sorun oluştu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // formatDate artık constants/ExpenseEnums.ts'den import ediliyor

  // Category mapping - API dokümantasyonuna göre string kategoriler
  // getCategoryIcon ve getCategoryColor artık constants/ExpenseEnums.ts'den import ediliyor

  const getExpenseCategories = () => {
    const categories = {};
    if (Array.isArray(expenses)) {
      expenses.forEach(exp => {
        // API dokümantasyonuna göre category alanını kullan
        const category = exp.category || 'Other'; // Default to Other
        const displayName = getCategoryDisplayName(category);
        
        if (!categories[displayName]) {
          categories[displayName] = { total: 0, count: 0 };
        }
        categories[displayName].total += Number(exp.tutar || 0);
        categories[displayName].count += 1;
      });
    }

    // Düzenli harcamalar bölümünde boş da olsa görünmesi istenen kategorileri ekle
    const preferredOrder = ['Kira', 'İnternet', 'Elektrik', 'Su', 'Doğalgaz', 'Market', 'Yemek', 'Diğer'];
    preferredOrder.forEach((name) => {
      if (!categories[name]) {
        categories[name] = { total: 0, count: 0 };
      }
    });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      percentage: overview ? (data.total / overview.totalExpenses * 100) : 0
    }))
    // Önce öncelikli kategoriler, sonra tutara göre sırala
    .sort((a, b) => {
      const ai = preferredOrder.indexOf(a.name);
      const bi = preferredOrder.indexOf(b.name);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return b.total - a.total;
    });
  };


  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Harcama özeti yükleniyor...</Text>
        </View>
      </View>
    );
  }

  const categories = getExpenseCategories();

  // Kategori tıklama → ilgili listeye git
  const BILL_TYPE_BY_NAME = { 'Kira': 1, 'İnternet': 5, 'Elektrik': 2, 'Su': 3, 'Doğalgaz': 4 };
  const onCategoryPress = (name) => {
    const t = BILL_TYPE_BY_NAME[name];
    if (t) {
      navigation.navigate('BillListScreen', { houseId, houseName, utilityType: t, categoryName: name });
    } else {
      navigation.navigate('ExpenseListScreen', { houseId, houseName });
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Özeti</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName || 'Ev'} • Genel bakış
          </Text>
        </View>

        {/* Genel İstatistikler (sade) */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📊 Genel İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatAmount(overview?.totalSpending)}</Text>
              <Text style={styles.statLabel}>Toplam Harcama</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overview?.memberCount || 0}</Text>
              <Text style={styles.statLabel}>Üye Sayısı</Text>
            </View>
          </View>
        </View>

        {/* Kategori özetleri kaldırıldı */}

        {/* Tüm Harcamalar */}
        {expenses.length > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>💰 Tüm Harcamalar</Text>
            <View style={CommonStyles.listContainer}>
              {expenses
                .slice()
                .sort((a,b) => new Date(b.postDate||b.createdAt||b.kayitTarihi||0) - new Date(a.postDate||a.createdAt||a.kayitTarihi||0))
                .map((expense, idx) => {
                // Yeni alanları kullan, eski alanlara fallback
                const category = expense.category || expense.tur || 'Other';
                const displayName = getCategoryDisplayName(category);
                const spenderName = expense.odeyenKullaniciAdi || expense.odeyenUser?.fullName || 'Bilinmeyen';
                const date = expense.postDate || expense.createdAt || expense.kayitTarihi;
                
                return (
                  <View key={String(expense.id ?? idx)} style={CommonStyles.listItem}>
                    <View style={[styles.expenseIcon, { backgroundColor: (getCategoryColorUI(category) || Colors.primary[500]) + '20' }]}>
                      <Text style={styles.expenseIconText}>{getCategoryIcon(category)}</Text>
                    </View>
                    <View style={CommonStyles.listItemContent}>
                      <Text style={CommonStyles.listItemTitle}>{displayName}</Text>
                      <Text style={CommonStyles.listItemSubtitle}>
                        {spenderName} • {formatDate(date)}
                      </Text>
                    </View>
                    <View style={styles.expenseAmount}>
                      <Text style={[styles.amountText, { color: getCategoryColorUI(category) || Colors.primary[500] }]}>
                        {formatAmount(expense.tutar)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}


        {/* Aksiyon Butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => navigation.navigate('AddExpenseScreen', { houseId, houseName })}
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
            onPress={() => navigation.navigate('ExpenseListScreen', { houseId, houseName })}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
              <Text style={CommonStyles.buttonIcon}>📋</Text>
              <Text style={CommonStyles.buttonText}>Tüm Harcamalar</Text>
              <Text style={CommonStyles.buttonSubtext}>Detaylı liste görüntüle</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
            <Text style={CommonStyles.buttonIcon}>🔙</Text>
            <Text style={CommonStyles.buttonText}>Geri Dön</Text>
            <Text style={CommonStyles.buttonSubtext}>Önceki sayfaya dön</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary[700],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  spenderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  spenderIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
  },
  spenderAmount: {
    alignItems: 'flex-end',
  },
  expenseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIconText: {
    fontSize: 20,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
});

export default HouseSpendingOverviewScreen;
