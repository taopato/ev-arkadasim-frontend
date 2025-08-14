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

const SignupScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.sendVerificationCode(email.trim());

      if (response.status === 200) {
        Alert.alert(
          'Doğrulama Kodu Gönderildi',
          'Email adresinize doğrulama kodu gönderildi. Lütfen email\'inizi kontrol edin.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                navigation.navigate('VerificationScreen', {
                  email: email.trim(),
                  fullName: fullName.trim(),
                  password: password,
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt işlemi başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Hesap Oluştur</Text>
          <Text style={CommonStyles.subtitle}>
            Ev arkadaşlarınızla harcamalarınızı yönetmeye başlayın
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Ad Soyad</Text>
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
              placeholder="Adınız ve soyadınız"
              placeholderTextColor={Colors.text.secondary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

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

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Şifre</Text>
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
              placeholder="En az 6 karakter"
              placeholderTextColor={Colors.text.secondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Şifre Tekrar</Text>
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
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={Colors.text.secondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Text style={styles.infoText}>
            📧 Kayıt işlemi için email adresinize doğrulama kodu gönderilecektir.
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!fullName.trim() || !email.trim() || !password || !confirmPassword || loading) && { opacity: 0.5 }
          ]}
          onPress={handleSignup}
          disabled={!fullName.trim() || !email.trim() || !password || !confirmPassword || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
            <Text style={CommonStyles.buttonIcon}>👤</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Gönderiliyor..." : "Hesap Oluştur"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Doğrulama kodu ile kayıt ol</Text>
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
            <Text style={CommonStyles.buttonSubtext}>Zaten hesabınız var mı?</Text>
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
    borderLeftColor: Colors.primary[300],
  },
});

export default SignupScreen;
