import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

export default function VerificationScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sayaç için state
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);

  // Sayaç mekanizması
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResendCode = async () => {
    setCanResend(false); // Kod yeniden gönder butonunu devre dışı bırak
    setTimer(180); // 3 dakikalık sayaç başlat
    try {
      await api.post('/Auth/SendVerificationCode', { email }, {
        headers: { 'Content-Type': 'application/json' },
      });
      Alert.alert('Başarılı', 'Doğrulama kodu yeniden gönderildi.');
    } catch (error) {
      console.error('Hata:', error.response?.data || error.message); // Hata detaylarını konsola yazdır
      Alert.alert('Hata', 'Kod yeniden gönderilemedi. Lütfen tekrar deneyin.');
    }
  };
  

  const handleVerifyAndRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler uyuşmuyor.');
      return;
    }

    setLoading(true);
    try {
      const data = { email, code, password, fullName };
      await api.post('/Auth/VerifyCodeAndRegister', data);
      Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı. Giriş ekranına yönlendiriliyorsunuz.');
      navigation.navigate('Login'); // Giriş ekranına yönlendir
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Doğrulama veya kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doğrulama ve Kayıt</Text>
      <TextInput
        style={styles.input}
        placeholder="Ad Soyad"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Doğrulama Kodu"
        value={code}
        onChangeText={setCode}
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
        placeholder="Şifreyi Tekrar Girin"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title="Kayıt Ol" onPress={handleVerifyAndRegister} disabled={loading} />
      <View style={styles.timerContainer}>
        <Text>{`Kalan Süre: ${Math.floor(timer / 60)}:${timer % 60}`}</Text>
        <Button
          title="Kod Yeniden Gönder"
          onPress={handleResendCode}
          disabled={!canResend}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, marginBottom: 16, paddingHorizontal: 8 },
  timerContainer: { alignItems: 'center', marginTop: 16 },
});
