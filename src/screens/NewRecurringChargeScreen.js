import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
// Geçici: charges hooks henüz yoksa import kaldırıldı. İleride gerçek hook ile değiştirilecek.
const useCreateRecurringCharge = () => ({ mutateAsync: async () => {} });
import { houseApi } from '../services/api';

const NewRecurringChargeScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const createMutation = useCreateRecurringCharge();
  const [members, setMembers] = useState([]);

  const [type, setType] = useState('Rent');
  const [amountMode, setAmountMode] = useState('Fixed');
  const [splitPolicy, setSplitPolicy] = useState('Equal');
  const [payerUserId, setPayerUserId] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await houseApi.getMembers(houseId);
        const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
        setMembers(arr);
      } catch (e) {
        setMembers([]);
      }
    })();
  }, [houseId]);

  const onSave = async () => {
    try {
      if (!payerUserId) return Alert.alert('Hata', 'Payer seçiniz');
      if (!(Number(fixedAmount) > 0)) return Alert.alert('Hata', 'Aylık tutar > 0 olmalı');
      if (!(Number(dueDay) >= 1 && Number(dueDay) <= 28)) return Alert.alert('Hata', 'Vade günü 1-28');
      const body = {
        houseId: Number(houseId),
        type,
        payerUserId: Number(payerUserId),
        amountMode,
        splitPolicy,
        fixedAmount: Number(String(fixedAmount).replace(',', '.')),
        dueDay: Number(dueDay),
        paymentWindowDays: 5,
        estimatedAmount: null,
        weights: null,
        startMonth,
        isActive: true,
      };
      await createMutation.mutateAsync(body);
      Alert.alert('Başarılı', 'Sözleşme oluşturuldu');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Kaydedilemedi');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={CommonStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={CommonStyles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Düzenli Gider Ekle</Text>
          <Text style={CommonStyles.subtitle}>{houseName}</Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>Gider Bilgisi</Text>
          <Text style={CommonStyles.label}>Tür</Text>
          <View style={styles.row}>
            {[
              { key: 'Rent', label: 'Kira' },
              { key: 'Internet', label: 'İnternet' },
              { key: 'Other', label: 'Diğer' },
            ].map((t) => (
              <TouchableOpacity key={t.key} style={[styles.chip, type===t.key&&styles.chipActive]} onPress={() => setType(t.key)}>
                <Text style={[styles.chipText, type===t.key&&styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={CommonStyles.label}>Ödeyecek kişi</Text>
          <View style={styles.rowWrap}>
            {members.map((m) => (
              <TouchableOpacity key={String(m.userId||m.id)} style={[styles.chip, String(payerUserId)===String(m.userId||m.id)&&styles.chipActive]} onPress={() => setPayerUserId(String(m.userId||m.id))}>
                <Text style={[styles.chipText, String(payerUserId)===String(m.userId||m.id)&&styles.chipTextActive]}>{m.fullName||m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={CommonStyles.label}>Aylık tutar (₺)</Text>
          <TextInput style={styles.input} value={fixedAmount} onChangeText={setFixedAmount} keyboardType="numeric" placeholder="78000" />

          <Text style={CommonStyles.label}>Vade günü (1-28)</Text>
          <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} keyboardType="numeric" placeholder="20" />

          <Text style={CommonStyles.label}>Başlangıç ayı (YYYY-MM)</Text>
          <TextInput style={styles.input} value={startMonth} onChangeText={setStartMonth} placeholder="2025-09" />

          <TouchableOpacity style={CommonStyles.menuButton} onPress={onSave} activeOpacity={0.8}>
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
              <Text style={CommonStyles.buttonIcon}>💾</Text>
              <Text style={CommonStyles.buttonText}>Kaydet</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: Colors.text.primary },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: Colors.neutral[300], paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  chipActive: { backgroundColor: Colors.primary[100], borderColor: Colors.primary[500] },
  chipText: { color: Colors.text.primary },
  chipTextActive: { color: Colors.text.primary, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 8, padding: 10, backgroundColor: Colors.background, color: Colors.text.primary, marginBottom: 12 },
});

export default NewRecurringChargeScreen;


