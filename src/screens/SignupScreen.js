import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setLoading(true);
    try {
        const response = await api.post(
            '/Auth/SendVerificationCode', // Endpoint URL'si
            JSON.stringify(email), // Email'i düz string olarak JSON formatında gönderiyoruz
            {
                headers: { 'Content-Type': 'application/json' }, // JSON header'ını belirtiyoruz
            }
        );
        Alert.alert('Başarılı', 'Doğrulama kodu e-posta adresinize gönderildi.');
    } catch (error) {
        console.error('Error:', error.response?.data || error.message); // Hata detaylarını logla
        Alert.alert('Hata', 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
        setLoading(false); // Yükleniyor durumunu sıfırla
    }
};







  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      <TextInput
        style={styles.input}
        placeholder="E-posta adresinizi girin"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Doğrulama Kodu Gönder" onPress={handleSendCode} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, marginBottom: 16, paddingHorizontal: 8 },
});
