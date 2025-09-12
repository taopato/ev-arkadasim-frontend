import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { expensesApi, houseApi } from '../services/api';

const HarcamaEkleScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();

  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!houseId) {
      Alert.alert('Hata', 'Geçerli bir ev ID\'si bulunamadı.');
      navigation.goBack();
      return;
    }
    fetchMembers();
  }, [houseId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await houseApi.getMembers(houseId);
      const data = response.data;
      if (data && Array.isArray(data)) {
        const validMembers = data
          .filter(m => m && (m.fullName || m.name) && (m.id || m.userId))
          .map(m => ({ ...m, id: m.id || m.userId, fullName: m.fullName || m.name }));
        setMembers(validMembers);
      } else {
        setMembers([]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Ev üyeleri alınamadı: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevamEt = async () => {
    if (!expenseType || !amount || !payerId) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const numericAmount = parseFloat(String(amount).replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar giriniz.');
      return;
    }

    try {
      const expenseData = {
        tur: expenseType,
        tutar: numericAmount,
        houseId: parseInt(houseId),
        odeyenUserId: parseInt(payerId),
        kaydedenUserId: user.id,
      };
      const response = await expensesApi.addExpense(expenseData);
      if (response.data) {
        Alert.alert('Başarılı', 'Harcama başarıyla eklendi!', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
      } else {
        throw new Error('Harcama eklenemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Harcama eklenirken bir sorun oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  const expenseTypes = [
    { label: 'Market', value: 'Market' },
    { label: 'Diğer', value: 'Diğer' },
    { label: 'Yemek', value: 'Yemek' },
    { label: 'Borç', value: 'Borç' },
    { label: 'Elektrik', value: 'Elektrik' },
    { label: 'Su', value: 'Su' },
    { label: 'Doğalgaz', value: 'Doğalgaz' },
  ];

  const pickerSelectStyles = {
    inputAndroid: {
      borderWidth: 1,
      borderColor: Colors.neutral[300],
      borderRadius: 8,
      padding: 12,
      backgroundColor: Colors.background,
      marginBottom: 16,
      color: Colors.text.primary,
    },
    inputIOS: {
      borderWidth: 1,
      borderColor: Colors.neutral[300],
      borderRadius: 8,
      padding: 12,
      backgroundColor: Colors.background,
      marginBottom: 16,
      color: Colors.text.primary,
    },
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Ekle</Text>
          <Text style={CommonStyles.subtitle}>{houseName || 'Ev'} • Yeni bir harcama kaydı oluşturun</Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Harcama Türü</Text>
            {Platform.OS === 'web' ? (
              <select
                style={{
                  width: '100%', height: 45, padding: '8px 12px', borderWidth: 1,
                  borderColor: Colors.neutral[300], borderRadius: 8, backgroundColor: Colors.background,
                  color: Colors.text.primary, fontSize: 16,
                }}
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
              >
                <option key="expense-type-default" value="">Bir harcama türü seçin</option>
                {expenseTypes.map((t) => (
                  <option key={`expense-type-${t.value}`} value={t.value}>{t.label}</option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setExpenseType(value || '')}
                value={expenseType}
                items={expenseTypes}
                placeholder={{ label: 'Bir harcama türü seçin', value: null }}
                style={pickerSelectStyles}
              />
            )}
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Harcama Tutarı</Text>
            <TextInput
              style={styles.input}
              placeholder="Harcama tutarını girin"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Ödemeyi Yapan</Text>
            {Platform.OS === 'web' ? (
              <select
                style={{
                  width: '100%', height: 45, padding: '8px 12px', borderWidth: 1,
                  borderColor: Colors.neutral[300], borderRadius: 8, backgroundColor: Colors.background,
                  color: Colors.text.primary, fontSize: 16,
                }}
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
              >
                <option key="payer-default" value="">Üyelerden birini seçin</option>
                {members.filter(m => m.id).map(m => (
                  <option key={String(m.id)} value={String(m.id)}>{m.fullName || 'İsimsiz Üye'}</option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setPayerId(value ? String(value) : '')}
                value={payerId || null}
                items={members.filter(m => m.id).map(m => ({ label: m.fullName || 'İsimsiz Üye', value: String(m.id), key: String(m.id) }))}
                placeholder={{ label: 'Üyelerden birini seçin', value: null }}
                style={pickerSelectStyles}
              />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[CommonStyles.menuButton, (!expenseType || !amount || !payerId || loading) && { opacity: 0.5 }]}
          onPress={handleDevamEt}
          disabled={!expenseType || !amount || !payerId || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>💰</Text>
            <Text style={CommonStyles.buttonText}>{loading ? 'Ekleniyor...' : 'Devam Et'}</Text>
            <Text style={CommonStyles.buttonSubtext}>Harcama detaylarını belirleyin</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
    fontSize: 16,
  },
});

export default HarcamaEkleScreen;


