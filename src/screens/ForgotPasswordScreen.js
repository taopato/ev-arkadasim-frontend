import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import { authApi } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen email adresinizi girin.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.sendVerificationCode(email.trim());
      if (response.status === 200) {
        Alert.alert(
          'Doğrulama Kodu Gönderildi',
          'Email adresinize şifre sıfırlama kodu gönderildi. Lütfen email\'inizi kontrol edin.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                setEmail('');
                navigation.navigate('ResetPasswordScreen', { email: email.trim() });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      Alert.alert('Hata', 'Şifre sıfırlama başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Şifremi Unuttum</Text>
          <Text style={CommonStyles.subtitle}>
            Email adresinize şifre sıfırlama kodu gönderelim
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Email Adresi</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background,
                fontSize: 16,
                color: Colors.text.primary,
              }}
              placeholder="ornek@email.com"
              placeholderTextColor={Colors.text.secondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.infoText}>
            📧 Email adresinize şifre sıfırlama kodu gönderilecektir. 
            Kodu aldıktan sonra yeni şifrenizi belirleyebilirsiniz.
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!email.trim() || loading) && { opacity: 0.5 }
          ]}
          onPress={handleResetPassword}
          disabled={!email.trim() || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
            <Text style={CommonStyles.buttonIcon}>🔐</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Kodu Gönder"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Email adresinize kod gönder</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
            <Text style={CommonStyles.buttonIcon}>🔙</Text>
            <Text style={CommonStyles.buttonText}>Giriş Yap</Text>
            <Text style={CommonStyles.buttonSubtext}>Giriş sayfasına dön</Text>
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

export default ForgotPasswordScreen;
