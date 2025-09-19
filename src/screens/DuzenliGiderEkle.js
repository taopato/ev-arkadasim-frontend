// NewRecurringChargeScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCommonStyles, makeColorThemes } from '../shared/ui/CommonStyles';
import { useTheme } from '../shared/theme/ThemeProvider';
import api, { houseApi, expensesApi } from '../services/api';
import eventBus from '../shared/events/bus';
import { getCategoryDisplayName, toExpenseCategory } from '../constants/ExpenseEnums';

// ==== TR Para Girişi Yardımcıları (Kuruş YOK) ====
const formatThousandsTRInput = (text) => {
  if (text == null) return '';
  const digits = String(text).replace(/\D/g, '');
  if (!digits) return '';
  const intStr = digits.replace(/^0+(?=\d)/, '');
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const parseIntFromTR = (s) => {
  if (!s) return 0;
  const digits = String(s).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

const NewRecurringChargeScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const CommonStyles = useCommonStyles();
  const { theme } = useTheme();
  const ColorThemes = makeColorThemes(theme);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [members, setMembers] = useState([]);
  const [mode, setMode] = useState(route?.params?.defaultMode || 'recurring'); // irregular | recurring | installment
  const [type, setType] = useState('Rent');                                     // Rent | Internet | Electricity | Water | Gas | Other
  const [payerUserId, setPayerUserId] = useState('');

  const [fixedAmount, setFixedAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const [dueDay, setDueDay] = useState('5');
  const [installmentCount, setInstallmentCount] = useState('6');
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [participants, setParticipants] = useState([]); // ids (string)

  useEffect(() => {
    // Tüm utility türleri planlı kabul: recurring
    if (type === 'Rent' || type === 'Internet' || type === 'Water' || type === 'Electricity' || type === 'Gas') {
      setMode('recurring');
    } else {
      setMode('irregular');
    }
  }, [type]);

  useEffect(() => {
    (async () => {
      try {
        const res = await houseApi.getMembers(houseId);
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
        const arr = raw.map(x => ({
          userId: x.userId ?? x.UserId,
          fullName: x.fullName ?? x.FullName ?? x.name ?? x.Name ?? 'Bilinmeyen'
        }));
        setMembers(arr);

        const me = arr.find(a => String(a.userId) === String(user?.id));
        if (me) setPayerUserId(String(me.userId));
      } catch (e) {
        setMembers([]);
      }
    })();
  }, [houseId, user?.id]);

  const onSave = async () => {
    try {
      if (!payerUserId) return Alert.alert('Hata', 'Ödeyecek kişi seçiniz');
      const dueDayNum = Number(dueDay);
      if (!(dueDayNum >= 1 && dueDayNum <= 28)) return Alert.alert('Hata', 'Vade günü 1-28');

      if (!startMonth || !/^\d{4}-\d{2}$/.test(startMonth)) {
        return Alert.alert('Hata', 'Başlangıç ayı YYYY-MM olmalı');
      }
      const [year, month] = startMonth.split('-');
      const isoStart = `${year}-${month}-01T00:00:00Z`;

      const safeTur = getCategoryDisplayName(type); // "Kira", "Elektrik", ...
      const categoryEnum = toExpenseCategory(type); // enum numeric
      const descriptionSafe = `${safeTur} • Başlangıç ${startMonth}`; // 🔸 Description NOT NULL çözümü

      if (mode === 'installment') {
        const total = parseIntFromTR(totalAmount);
        if (!(total > 0)) return Alert.alert('Hata', 'Toplam tutar > 0 olmalı');
        if (!(Number(installmentCount) >= 2)) return Alert.alert('Hata', 'Taksit sayısı en az 2 olmalı');

        const body = {
          mode: 'installment',
          tur: safeTur,
          category: categoryEnum,
          categoryId: categoryEnum,
          CategoryId: categoryEnum,
          tutar: total, // toplam
          installmentCount: Number(installmentCount),
          dueDay: dueDayNum,
          startMonth: isoStart,
          houseId: Number(houseId),
          odeyenUserId: Number(payerUserId),
          kaydedenUserId: Number(user?.id),
          cardholderUserId: Number(payerUserId),
          participants: participants.length ? participants.map((id) => Number(id)) : [],
          // 🔸 Description zorunlu
          description: descriptionSafe,
          Description: descriptionSafe,
          Aciklama: descriptionSafe,
        };

        await expensesApi.create(body);

        Alert.alert('Başarılı', 'Taksitli plan oluşturuldu');
        eventBus.emit('expenses:updated', { houseId });
        navigation.goBack();
        return;
      }

      if (mode === 'recurring') {
        const monthly = parseIntFromTR(fixedAmount);
        if (!(monthly > 0)) return Alert.alert('Hata', 'Aylık tutar > 0 olmalı');

        const body = {
          mode: 'recurring',
          tur: safeTur,
          category: categoryEnum,
          categoryId: categoryEnum,
          CategoryId: categoryEnum,
          tutar: monthly,               // aylık
          houseId: Number(houseId),
          odeyenUserId: Number(payerUserId),
          kaydedenUserId: Number(user?.id),
          dueDay: dueDayNum,
          startMonth: isoStart,
          ortakHarcamaTutari: monthly,
          sahsiHarcamalar: [],
          // 🔸 Description zorunlu
          description: descriptionSafe,
          Description: descriptionSafe,
          Aciklama: descriptionSafe,
        };

        await expensesApi.create(body);

        Alert.alert('Başarılı', 'Düzenli gider oluşturuldu');
        eventBus.emit('expenses:updated', { houseId });
        navigation.goBack();
        return;
      }

      // IRREGULAR (tek seferlik)
      const once = parseIntFromTR(fixedAmount);
      if (!(once > 0)) return Alert.alert('Hata', 'Tutar > 0 olmalı');

      const payload = {
        tur: safeTur,
        category: categoryEnum,
        categoryId: categoryEnum,
        CategoryId: categoryEnum,
        tutar: once,
        houseId: Number(houseId),
        odeyenUserId: Number(payerUserId),
        kaydedenUserId: Number(user?.id),
        date: new Date().toISOString(),
        ortakHarcamaTutari: once,
        sahsiHarcamalar: [],
        // 🔸 Description zorunlu
        description: `${safeTur} • ${new Date().toISOString().slice(0,10)}`,
        Description: `${safeTur} • ${new Date().toISOString().slice(0,10)}`,
        Aciklama: `${safeTur} • ${new Date().toISOString().slice(0,10)}`,
      };

      await expensesApi.create(payload);

      Alert.alert('Başarılı', 'Düzensiz gider oluşturuldu');
      eventBus.emit('expenses:updated', { houseId });
      navigation.goBack();
    } catch (e) {
      console.error('❌ Düzenli gider ekleme hatası:', e);
      console.error('❌ Error response:', e?.response?.data);
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
          <Text style={CommonStyles.title}>Yeni Gider</Text>
          <Text style={CommonStyles.subtitle}>{houseName}</Text>
          <Text style={[CommonStyles.subtitle, { marginTop: 4, fontWeight: '800', color: theme.colors.primary[600] }]}>Düzenli Gider Ekle</Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>Ödeme Türü</Text>
          <View style={styles.rowWrap}>
            {[
              { key: 'irregular', label: 'Düzensiz' },
              { key: 'recurring', label: 'Düzenli' },
              { key: 'installment', label: 'Taksitli' },
            ].map((m) => {
              const disabled =
                ((type === 'Rent' || type === 'Internet') && m.key !== 'recurring') ||
                ((type === 'Water' || type === 'Electricity' || type === 'Gas') && m.key !== 'irregular');
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.chip, mode === m.key && styles.chipActive, disabled && { opacity: 0.4 }]}
                  disabled={disabled}
                  onPress={() => setMode(m.key)}
                >
                  <Text style={[styles.chipText, mode === m.key && styles.chipTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Gider Bilgisi</Text>
          <Text style={CommonStyles.label}>Kategori</Text>
          <View style={styles.rowWrap}>
            {[
              { key: 'Rent', label: 'Kira' },
              { key: 'Internet', label: 'İnternet' },
              { key: 'Electricity', label: 'Elektrik' },
              { key: 'Water', label: 'Su' },
              { key: 'Gas', label: 'Doğalgaz' },
              { key: 'Other', label: 'Diğer' },
            ].map((t) => (
              <TouchableOpacity key={t.key} style={[styles.chip, type === t.key && styles.chipActive]} onPress={() => setType(t.key)}>
                <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ödeyecek kişi seçimi */}
          <Text style={CommonStyles.label}>Ödeyecek kişi</Text>
          <View style={styles.rowWrap}>
            {members.map((m) => {
              const selected = String(payerUserId) === String(m.userId);
              return (
                <TouchableOpacity
                  key={String(m.userId)}
                  style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => setPayerUserId(String(m.userId))}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {m.fullName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(mode === 'recurring' || mode === 'irregular') && (
            <>
              <Text style={CommonStyles.label}>{mode === 'recurring' ? 'Aylık tutar (₺)' : 'Tutar (₺)'}</Text>
              <TextInput
                style={styles.input}
                value={fixedAmount}
                onChangeText={(text) => setFixedAmount(formatThousandsTRInput(text))}
                keyboardType="numeric"
                placeholder="20.000"
              />
              <Text style={CommonStyles.label}>Vade günü (1-28)</Text>
              <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} keyboardType="numeric" placeholder="20" />
              {mode === 'recurring' && (
                <>
                  <Text style={CommonStyles.label}>Başlangıç ayı (YYYY-MM)</Text>
                  <TextInput style={styles.input} value={startMonth} onChangeText={setStartMonth} placeholder="2025-10" />
                </>
              )}
            </>
          )}

          {mode === 'installment' && (
            <>
              <Text style={CommonStyles.label}>Toplam tutar (₺)</Text>
              <TextInput
                style={styles.input}
                value={totalAmount}
                onChangeText={(text) => setTotalAmount(formatThousandsTRInput(text))}
                keyboardType="numeric"
                placeholder="120.000"
              />
              <Text style={CommonStyles.label}>Taksit sayısı</Text>
              <View style={styles.row}>
                {['3','6','9','12'].map(n => (
                  <TouchableOpacity key={n} style={[styles.chip, installmentCount === n && styles.chipActive]} onPress={() => setInstallmentCount(n)}>
                    <Text style={[styles.chipText, installmentCount === n && styles.chipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput style={[styles.input, { flex: 1 }]} value={installmentCount} onChangeText={setInstallmentCount} keyboardType="numeric" placeholder="6" />
              </View>

              <Text style={CommonStyles.label}>Vade günü (1-28)</Text>
              <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} keyboardType="numeric" placeholder="10" />

              <Text style={CommonStyles.label}>Başlangıç ayı (YYYY-MM)</Text>
              <TextInput style={styles.input} value={startMonth} onChangeText={setStartMonth} placeholder="2025-10" />

              <Text style={CommonStyles.label}>Katılımcılar</Text>
              <View style={styles.rowWrap}>
                {members.map((m) => {
                  const id = String(m.userId);
                  const active = participants.includes(id);
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setParticipants(prev => active ? prev.filter(x => x !== id) : [...prev, id])}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.fullName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

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

function makeStyles(theme) {
  return StyleSheet.create({
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: theme.colors.text.primary },
    row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { borderWidth: 1, borderColor: theme.colors.neutral[300], paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
    chipActive: { backgroundColor: theme.colors.primary[100], borderColor: theme.colors.primary[500] },
    chipText: { color: theme.colors.text.primary },
    chipTextActive: { color: theme.colors.text.primary, fontWeight: '700' },
    input: { borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, padding: 10, backgroundColor: theme.colors.background, color: theme.colors.text.primary, marginBottom: 12 },
  });
}

export default NewRecurringChargeScreen;
