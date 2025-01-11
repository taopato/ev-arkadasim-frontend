import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

export default function AddExpenseScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const ExpenseSchema = Yup.object().shape({
    itemName: Yup.string().required('Harcama adı gerekli'),
    amount: Yup.number().required('Tutar gerekli').positive('Tutar pozitif olmalı'),
  });

  const handleAddExpense = async (values) => {
    setLoading(true);
    try {
      await api.post('/Expenses', values);
      Alert.alert('Başarılı', 'Harcama başarıyla eklendi.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Harcama eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yeni Harcama Ekle</Text>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Yükleniyor...</Text>
        </View>
      )}
      <Formik initialValues={{ itemName: '', amount: '' }} validationSchema={ExpenseSchema} onSubmit={handleAddExpense}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <Text style={styles.label}>Harcama Adı:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('itemName')}
              onBlur={handleBlur('itemName')}
              value={values.itemName}
              placeholder="Ör: Market Alışverişi"
            />
            {errors.itemName && touched.itemName ? <Text style={styles.errorText}>{errors.itemName}</Text> : null}

            <Text style={styles.label}>Tutar (TL):</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('amount')}
              onBlur={handleBlur('amount')}
              value={values.amount}
              placeholder="Ör: 150"
              keyboardType="numeric"
            />
            {errors.amount && touched.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

            <Button title="Harcama Ekle" onPress={handleSubmit} disabled={loading} />
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 18, marginBottom: 8 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 16, paddingHorizontal: 8, borderRadius: 5 },
  loadingContainer: { alignItems: 'center', marginBottom: 16 },
  errorText: { color: 'red', fontSize: 14, marginBottom: 8 },
});
