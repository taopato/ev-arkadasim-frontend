import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import api from '../api';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/Expenses') // 'api' kullanarak çağrı yapılıyor
      .then(response => {
        setExpenses(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setError('Veriler yüklenirken bir hata oluştu');
        setLoading(false);
      });
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.itemCost}>{item.cost} TL</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size={50} color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={item => item.expenseId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 16 },
  itemContainer: { backgroundColor: '#f8f9fa', padding: 12, marginVertical: 8, borderRadius: 8 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemCost: { fontSize: 14, color: '#555' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16 },
});
