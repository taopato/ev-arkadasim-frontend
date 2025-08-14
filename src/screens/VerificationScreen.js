import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { authApi } from '../services/api';

const VerificationScreen = ({ navigation, route }) => {
  const { email, fullName, password } = route.params || {};
  const { login } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Hata', 'Lütfen doğrulama kodunu girin.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyCodeAndRegister(email, verificationCode.trim(), fullName, password);
      const payload = response?.data?.data;

      if (payload && payload.token && payload.user) {
          await login(payload.user, payload.token);
          Alert.alert(
            'Başarılı',
            'Hesabınız başarıyla oluşturuldu! Hoş geldiniz.',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                })
              }
            ]
          );
      }
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      Alert.alert('Hata', 'Doğrulama başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await authApi.sendVerificationCode(email);
      Alert.alert('Başarılı', 'Yeni doğrulama kodu gönderildi. Lütfen email\'inizi kontrol edin.');
    } catch (error) {
      console.error('Kod gönderme hatası:', error);
      Alert.alert('Hata', 'Kod gönderilemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Email Doğrulama</Text>
          <Text style={CommonStyles.subtitle}>
            {email} adresine gönderilen kodu girin
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Doğrulama Kodu</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background,
                fontSize: 16,
                color: Colors.text.primary,
                textAlign: 'center',
                letterSpacing: 8,
              }}
              placeholder="000000"
              placeholderTextColor={Colors.text.secondary}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <Text style={styles.infoText}>
            📧 {email} adresine 6 haneli doğrulama kodu gönderildi. 
            Lütfen email\'inizi kontrol edin ve kodu buraya girin.
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!verificationCode.trim() || loading) && { opacity: 0.5 }
          ]}
          onPress={handleVerification}
          disabled={!verificationCode.trim() || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>✅</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Doğrulanıyor..." : "Hesabı Doğrula"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Hesabınızı aktifleştirin</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={handleResendCode}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
            <Text style={CommonStyles.buttonIcon}>📧</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Gönderiliyor..." : "Kodu Tekrar Gönder"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni kod talep edin</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.navigate('SignupScreen')}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
            <Text style={CommonStyles.buttonIcon}>🔙</Text>
            <Text style={CommonStyles.buttonText}>Geri Dön</Text>
            <Text style={CommonStyles.buttonSubtext}>Kayıt sayfasına dön</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[300],
  },
});

export default VerificationScreen;
