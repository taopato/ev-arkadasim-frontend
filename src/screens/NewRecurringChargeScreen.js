import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { useCreateRecurringCharge } from '../features/charges/hooks';
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
  const [paymentWindowDays, setPaymentWindowDays] = useState('5');
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [estimatedAmount, setEstimatedAmount] = useState('');

  // Düzenli giderler sadece sabit olabilir
  const RECURRING_CHARGES = ['Rent', 'Internet', 'Other'];
  
  // Seçili gider türüne göre otomatik mod seç
  const isRecurringCharge = RECURRING_CHARGES.includes(type);

  // Düzenli giderler her zaman sabit modda olmalı
  React.useEffect(() => {
    if (isRecurringCharge && amountMode !== 'Fixed') {
      setAmountMode('Fixed');
    }
  }, [type, isRecurringCharge, amountMode]);

  React.useEffect(() => {
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
         paymentWindowDays: 5, // Sabit ödeme süresi
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
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Düzenli Gider Ekle</Text>
          <Text style={CommonStyles.subtitle}>{houseName}</Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>Gider Bilgisi</Text>

                     <Text style={CommonStyles.label}>Düzenli Gider Türü</Text>
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

          <Text style={CommonStyles.label}>Ödemeyi yapacak kişi</Text>
          <View style={styles.rowWrap}>
            {members.map((m) => (
              <TouchableOpacity key={String(m.userId||m.id)} style={[styles.chip, String(payerUserId)===String(m.userId||m.id)&&styles.chipActive]} onPress={() => setPayerUserId(String(m.userId||m.id))}>
                <Text style={[styles.chipText, String(payerUserId)===String(m.userId||m.id)&&styles.chipTextActive]}>{m.fullName||m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={CommonStyles.label}>Paylaşım şekli (Eşit/Ağırlık)</Text>
          <View style={styles.row}>
            {[
              { key: 'Equal', label: 'Eşit paylaş' },
              { key: 'Weight', label: 'Ağırlıklı paylaşım' },
            ].map((s) => (
              <TouchableOpacity key={s.key} style={[styles.chip, splitPolicy===s.key&&styles.chipActive]} onPress={() => setSplitPolicy(s.key)}>
                <Text style={[styles.chipText, splitPolicy===s.key&&styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

                     <Text style={CommonStyles.label}>Düzenli Gider Açıklaması</Text>
           <View style={styles.infoBox}>
             <Text style={styles.infoText}>
               🏠 <Text style={styles.boldText}>{type === 'Rent' ? 'Kira' : type === 'Internet' ? 'İnternet' : 'Diğer'}</Text> - Her ay aynı tutar, belirli bir günde vade
             </Text>
             <Text style={styles.infoText}>
               💰 Bu gider her ay otomatik olarak oluşturulacak
             </Text>
           </View>

                                <Text style={CommonStyles.label}>Aylık tutar (₺)</Text>
           <TextInput style={styles.input} value={fixedAmount} onChangeText={setFixedAmount} keyboardType="numeric" placeholder="78000" />
           <Text style={styles.helpText}>
             💰 Bu tutar her ay aynı kalacak, değiştirene kadar sabit
           </Text>
           <Text style={CommonStyles.label}>Her ayın kaçıncı günü vade? (1-28)</Text>
           <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} keyboardType="numeric" placeholder="20" />
           <Text style={styles.helpText}>
             📅 Örnek: 20 girersen, her ayın 20'sinde vade olur. Sistem vade tarihi yaklaştığında otomatik ödeme oluşturur.
           </Text>

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
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: Colors.neutral[300], paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  chipActive: { backgroundColor: Colors.primary[100], borderColor: Colors.primary[500] },
  chipText: { color: Colors.text.primary },
  chipTextActive: { color: Colors.text.primary, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 8, padding: 10, backgroundColor: Colors.background, color: Colors.text.primary, marginBottom: 12 },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: -8,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default NewRecurringChargeScreen;


