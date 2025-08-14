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
import { useExpensesByHouse } from '../features/expenses/add-expense/hooks';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const ExpenseListScreen = ({ route, navigation }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();

  // Yeni expenses modülü hooks'u kullanıyoruz
  const { data: expensesResp = [], isLoading: loading, error, refetch } = useExpensesByHouse(houseId);

  useEffect(() => {
    if (!houseId) {
      Alert.alert('Hata', 'Ev bilgisi eksik.');
      navigation.goBack();
      return;
    }
  }, [houseId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });

    return unsubscribe;
  }, [navigation, refetch]);

  // Hata durumunu kontrol et
  useEffect(() => {
    if (error) {
      console.error('Harcama listesi hatası:', error);
      Alert.alert('Hata', 'Harcamalar alınırken bir sorun oluştu');
    }
  }, [error]);

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

  const handleAddExpense = () => {
    navigation.navigate('HarcamaEkleScreen', {
      houseId: houseId,
      houseName: houseName
    });
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

  const expenses = expensesResp?.data ?? expensesResp ?? [];

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Listesi</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName || 'Ev'} • {expenses.length} harcama
          </Text>
        </View>

        {/* Yeni Harcama Ekle Butonu */}
        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={handleAddExpense}
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
                    Tarih: {formatDate(expense.createdAt)}
                  </Text>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={[styles.amountText, { color: Colors.primary[600] }]}>
                    {formatAmount(expense.tutar)}
                  </Text>
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
  },
});

export default ExpenseListScreen;
