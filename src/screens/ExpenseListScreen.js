import React, { useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet, Button } from 'react-native';
import useApi from '../hooks/useApi';

export default function ExpenseListScreen({ navigation }) {
  const { data: expenses, loading, error, fetchData } = useApi('/Expenses');

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.expenseId.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemCost}>{item.cost} TL</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
      <Button
        title="Harcama Ekle"
        onPress={() => navigation.navigate('HarcamaEkle')}
        color="#007bff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  listContainer: { paddingBottom: 16 },
  itemContainer: { backgroundColor: '#e9ecef', padding: 12, marginVertical: 8, borderRadius: 8 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemCost: { fontSize: 14, color: '#555' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16 },
});
