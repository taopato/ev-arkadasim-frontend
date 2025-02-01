import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

const HarcamaListeleScreen = ({ route }) => {
  const { houseId } = route.params; // Ev ID'si
  const [expenses, setExpenses] = useState([]); // Harcama bilgileri
  const [loading, setLoading] = useState(true); // Yüklenme durumu

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get(`/Expenses/GetExpensesByHouse/${houseId}`);
      setExpenses(response.data);
    } catch (error) {
      Alert.alert('Hata', 'Harcama bilgileri alınamadı.');
      console.error('Harcama bilgileri çekilirken hata oluştu:', error);
    } finally {
      setLoading(false); // Yükleme işlemi tamamlandı
    }
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <Text style={styles.expenseType}>Tür: {item.tur}</Text>
      <Text style={styles.expenseAmount}>Tutar: {item.tutar} TL</Text>
      <Text style={styles.payer}>Ödeyen: {item.odeyenUser}</Text>
      <Text style={styles.date}>
        Tarih: {new Date(item.tarih).toLocaleDateString('tr-TR')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Harcama Listesi</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpenseItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz harcama bulunmamaktadır.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  expenseCard: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseAmount: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  payer: {
    fontSize: 14,
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 20,
  },
});

export default HarcamaListeleScreen;
