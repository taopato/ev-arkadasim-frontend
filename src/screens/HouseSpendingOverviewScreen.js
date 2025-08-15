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
import { houseApi, expensesApi, billsApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const HouseSpendingOverviewScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
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
      // Paralel olarak tüm verileri çek
      const [membersRes, expensesRes, billsRes] = await Promise.all([
        houseApi.getMembers(houseId),
        expensesApi.getByHouse(houseId),
        billsApi.getByHouse(houseId)
      ]);

      setMembers(membersRes.data || []);
      setExpenses(expensesRes.data || []);
      setBills(billsRes.data || []);

      // Genel özet hesapla
      const totalExpenses = (expensesRes.data || []).reduce((sum, exp) => sum + Number(exp.tutar || 0), 0);
      const totalBills = (billsRes.data || []).reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
      
      setOverview({
        totalSpending: totalExpenses + totalBills,
        totalExpenses,
        totalBills,
        memberCount: (membersRes.data || []).length,
        expenseCount: (expensesRes.data || []).length,
        billCount: (billsRes.data || []).length
      });

    } catch (error) {
      console.error('Harcama özeti hatası:', error);
      Alert.alert('Hata', 'Harcama özeti alınırken bir sorun oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `${parseFloat(amount || 0).toFixed(2)} ₺`;
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

  const getCategoryIcon = (category) => {
    const icons = {
      'Kira': '🏠',
      'Elektrik': '⚡',
      'Su': '💧',
      'Doğalgaz': '🔥',
      'İnternet': '🌐',
      'Market': '🛒',
      'Temizlik': '🧹',
      'Diğer': '📦'
    };
    return icons[category] || '💰';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Kira': Colors.primary[500],
      'Elektrik': Colors.warning[500],
      'Su': Colors.primary[400],
      'Doğalgaz': Colors.error[500],
      'İnternet': Colors.neutral[500],
      'Market': Colors.success[500],
      'Temizlik': Colors.primary[300],
      'Diğer': Colors.neutral[400]
    };
    return colors[category] || Colors.primary[500];
  };

  const getExpenseCategories = () => {
    const categories = {};
    expenses.forEach(exp => {
      const category = exp.tur || 'Diğer';
      if (!categories[category]) {
        categories[category] = { total: 0, count: 0 };
      }
      categories[category].total += Number(exp.tutar || 0);
      categories[category].count += 1;
    });
    return Object.entries(categories).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      percentage: overview ? (data.total / overview.totalExpenses * 100) : 0
    })).sort((a, b) => b.total - a.total);
  };

  const getTopSpenders = () => {
    const spenders = {};
    expenses.forEach(exp => {
      const spenderId = exp.odeyenUserId;
      const spenderName = exp.odeyenUser?.fullName || `Kullanıcı #${spenderId}`;
      if (!spenders[spenderId]) {
        spenders[spenderId] = { name: spenderName, total: 0, count: 0 };
      }
      spenders[spenderId].total += Number(exp.tutar || 0);
      spenders[spenderId].count += 1;
    });
    return Object.values(spenders).sort((a, b) => b.total - a.total).slice(0, 5);
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
  const topSpenders = getTopSpenders();

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Özeti</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName || 'Ev'} • Genel bakış
          </Text>
        </View>

        {/* Genel İstatistikler */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📊 Genel İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatAmount(overview?.totalSpending)}</Text>
              <Text style={styles.statLabel}>Toplam Harcama</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatAmount(overview?.totalExpenses)}</Text>
              <Text style={styles.statLabel}>Günlük Harcamalar</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatAmount(overview?.totalBills)}</Text>
              <Text style={styles.statLabel}>Faturalar</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overview?.memberCount || 0}</Text>
              <Text style={styles.statLabel}>Üye Sayısı</Text>
            </View>
          </View>
        </View>

        {/* Harcama Kategorileri */}
        {categories.length > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>📂 Harcama Kategorileri</Text>
            <View style={CommonStyles.listContainer}>
              {categories.map((category, index) => (
                <View key={index} style={CommonStyles.listItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category.name) + '20' }]}>
                    <Text style={styles.categoryIconText}>{getCategoryIcon(category.name)}</Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>{category.name}</Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      {category.count} harcama • %{category.percentage.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={[styles.amountText, { color: getCategoryColor(category.name) }]}>
                      {formatAmount(category.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* En Çok Harcayanlar */}
        {topSpenders.length > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>👥 En Çok Harcayanlar</Text>
            <View style={CommonStyles.listContainer}>
              {topSpenders.map((spender, index) => (
                <View key={index} style={CommonStyles.listItem}>
                  <View style={styles.spenderIcon}>
                    <Text style={styles.spenderIconText}>
                      {spender.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>{spender.name}</Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      {spender.count} harcama
                    </Text>
                  </View>
                  <View style={styles.spenderAmount}>
                    <Text style={[styles.amountText, { color: Colors.primary[600] }]}>
                      {formatAmount(spender.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Son Harcamalar */}
        {expenses.length > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>🕒 Son Harcamalar</Text>
            <View style={CommonStyles.listContainer}>
              {expenses.slice(0, 5).map((expense) => (
                <View key={expense.id} style={CommonStyles.listItem}>
                  <View style={[styles.expenseIcon, { backgroundColor: getCategoryColor(expense.tur) + '20' }]}>
                    <Text style={styles.expenseIconText}>{getCategoryIcon(expense.tur)}</Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>{expense.tur || 'Harcama'}</Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      {expense.odeyenUser?.fullName || 'Bilinmeyen'} • {formatDate(expense.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.expenseAmount}>
                    <Text style={[styles.amountText, { color: getCategoryColor(expense.tur) }]}>
                      {formatAmount(expense.tutar)}
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
