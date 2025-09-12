// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { authApi } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = () => {
    if (!fullName.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }
    if (password !== confirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.sendVerificationCode(email.trim());
      if (res?.status === 200) {
        Alert.alert('Doğrulama Kodu Gönderildi', 'E-posta kutunuzu kontrol edin.', [
          { text: 'Devam', onPress: () => navigation.navigate('VerificationScreen', { email: email.trim(), fullName: fullName.trim(), password }) }
        ]);
      } else {
        Alert.alert('Hata', 'Kod gönderilemedi.');
      }
    } catch (e) {
      console.error('Kayıt hatası:', e);
      Alert.alert('Hata', e?.response?.data?.message || e.message || 'İşlem başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Hesap Oluştur</Text>
        <Text style={styles.subtitle}>Ev arkadaşlarınla harcamaları yönet.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            placeholder="Adınız ve soyadınız"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="En az 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Şifre Tekrar</Text>
          <TextInput
            style={styles.input}
            placeholder="Şifrenizi tekrar girin"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <Text style={styles.info}>📧 Kayıt için e-posta adresinize doğrulama kodu gelecektir.</Text>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Hesap Oluştur</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnNeutral]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: Colors.text.primary }]}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text.primary, marginBottom: 6 },
  subtitle: { color: Colors.text.secondary, marginBottom: 16 },
  card: { backgroundColor: Colors.background, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.neutral[200] },

  label: { fontWeight: '700', color: Colors.text.primary, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 10,
    padding: 12, fontSize: 16, color: Colors.text.primary, backgroundColor: '#fff'
  },
  info: { marginTop: 12, color: Colors.text.secondary, fontSize: 12 },

  btn: { paddingVertical: 12, borderRadius: 10, marginTop: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: Colors.primary[600] },
  btnNeutral: { backgroundColor: Colors.neutral[200] },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800' },
});

export default RegisterScreen;
