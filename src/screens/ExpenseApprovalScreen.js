import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpenseApprovalScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Harcama Onayı Ekranı</Text>
      <Text>Bu ekranda harcamaların onaylanmasını sağlayabilirsiniz.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default ExpenseApprovalScreen;
