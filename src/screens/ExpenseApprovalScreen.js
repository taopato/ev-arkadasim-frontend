import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { expensesApi } from '../services/api';

const ExpenseApprovalScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!houseId) {
      Alert.alert('Hata', 'Ev bilgisi eksik.');
      navigation.goBack();
      return;
    }
    fetchExpenses();
  }, [houseId]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expensesApi.getByHouse(houseId);
      const data = response.data;
      setExpenses(data || []);
    } catch (error) {
      console.error('Harcama listesi hatası:', error);
      Alert.alert('Hata', 'Harcamalar alınırken bir sorun oluştu');
    } finally {
      setLoading(false);
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

  const handleExpensePress = (expense) => {
    navigation.navigate('ExpenseDetailScreen', {
      expenseId: expense.id,
      houseId: houseId,
      houseName: houseName
    });
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Harcamalar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Onayları</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName || 'Ev'} • {expenses.length} harcama
          </Text>
        </View>

        {/* Yeni Harcama Ekle Butonu */}
        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.navigate('HarcamaEkleScreen', { houseId, houseName })}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>➕</Text>
            <Text style={CommonStyles.buttonText}>Yeni Harcama Ekle</Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni harcama kaydı oluşturun</Text>
          </View>
        </TouchableOpacity>

        {/* Harcama Listesi */}
        {expenses.length > 0 ? (
          <View style={CommonStyles.listContainer}>
            {expenses.map((expense) => (
              <TouchableOpacity
                key={expense.id.toString()}
                style={CommonStyles.listItem}
                onPress={() => handleExpensePress(expense)}
                activeOpacity={0.8}
              >
                <View style={styles.expenseIconContainer}>
                  <Text style={styles.expenseIcon}>💰</Text>
                </View>
                <View style={CommonStyles.listItemContent}>
                  <Text style={CommonStyles.listItemTitle}>
                    {expense.tur || 'Harcama'}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Ödeyen: {expense.odeyenUser?.fullName || 'Bilinmeyen'}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Kaydeden: {expense.kaydedenUser?.fullName || 'Bilinmeyen'}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Tarih: {formatDate(expense.createdAt)}
                  </Text>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={[styles.amountText, { color: Colors.primary[600] }]}>
                    {formatAmount(expense.tutar)}
                  </Text>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: Colors.success[600] }]}>
                      ✅ Onaylandı
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>📋</Text>
            <Text style={CommonStyles.emptyText}>
              Henüz harcama bulunmamaktadır.
            </Text>
            <Text style={CommonStyles.emptyText}>
              İlk harcamanızı eklemek için yukarıdaki butona tıklayın.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  expenseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIcon: {
    fontSize: 24,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ExpenseApprovalScreen;
