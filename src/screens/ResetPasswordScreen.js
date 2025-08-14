import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { authApi } from '../services/api';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email: routeEmail } = route.params || {};
  const [email, setEmail] = useState(routeEmail || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!email.trim() || !code.trim()) {
      Alert.alert('Hata', 'Email ve kod zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const resp = await authApi.verifyCodeForReset(email.trim(), code.trim());
      const ok = resp?.data?.data === true || resp?.data === true;
      if (ok) {
        Alert.alert('Doğrulandı', 'Kod doğrulandı. Yeni şifre belirleyebilirsiniz.');
      } else {
        Alert.alert('Hata', 'Kod doğrulanamadı.');
      }
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim() || !code.trim() || !newPassword) {
      Alert.alert('Hata', 'Tüm alanlar zorunludur.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    try {
      const resp = await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      const ok = resp?.data?.data === true || resp?.data === true;
      if (ok) {
        Alert.alert('Başarılı', 'Şifreniz değiştirildi.', [
          { text: 'Giriş Yap', onPress: () => navigation.replace('Login') }
        ]);
      } else {
        Alert.alert('Hata', 'Şifre değiştirilemedi.');
      }
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Şifreyi Sıfırla</Text>
          <Text style={CommonStyles.subtitle}>Email, kod ve yeni şifreyi girin</Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ornek@email.com"
            />
          </View>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Kod</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Yeni şifre"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            CommonStyles.menuButton,
            (!email.trim() || !code.trim() || loading) && { opacity: 0.5 }
          ]}
          onPress={handleVerify}
          disabled={!email.trim() || !code.trim() || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
            <Text style={CommonStyles.buttonIcon}>✅</Text>
            <Text style={CommonStyles.buttonText}>{loading ? 'Kontrol ediliyor...' : 'Kodu Doğrula'}</Text>
            <Text style={CommonStyles.buttonSubtext}>Kod geçerli mi kontrol et</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            CommonStyles.menuButton,
            (!email.trim() || !code.trim() || !newPassword || loading) && { opacity: 0.5 }
          ]}
          onPress={handleReset}
          disabled={!email.trim() || !code.trim() || !newPassword || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>🔐</Text>
            <Text style={CommonStyles.buttonText}>{loading ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}</Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni şifreyi kaydet</Text>
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
    color: Colors.text.primary,
  },
});

export default ResetPasswordScreen;
