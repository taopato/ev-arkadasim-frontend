import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      await api.post('/SendVerificationCode', { email });
      Alert.alert(
        'Kod Gönderildi',
        'Doğrulama kodu e-posta adresinize gönderildi.'
      );
      setCodeSent(true); // Kod gönderildi durumunu güncelle
    } catch (error) {
      console.error('Hata:', error.response?.data || error.message); // Hata detaylarını logla
      Alert.alert('Hata', 'Kod gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false); // Yüklenme durumunu sıfırla
    }
  };
  

  const registerUser = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler uyuşmuyor.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/VerifyCodeAndRegister', {
        email,
        code: verificationCode,
        password,
        fullName: 'Kullanıcı Adı', // Gerektiğinde kullanıcıdan alınabilir
      });
      Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı!');
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      <TextInput
        style={styles.input}
        placeholder="E-posta Adresi"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {codeSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Doğrulama Kodu"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre Tekrar"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Button
            title="Kayıt Ol"
            onPress={registerUser}
            disabled={loading}
          />
        </>
      ) : (
        <Button
          title="Doğrulama Kodu Gönder"
          onPress={sendVerificationCode}
          disabled={loading}
        />
      )}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
});
