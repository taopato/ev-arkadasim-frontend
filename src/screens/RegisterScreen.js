import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    if (password === confirmPassword) {
      Alert.alert('Kayıt Başarılı', 'Şifrenizle giriş yapabilirsiniz.');
      navigation.navigate('Login');
    } else {
      Alert.alert('Şifreler Eşleşmiyor', 'Lütfen şifreleri kontrol ediniz.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>E-posta:</Text>
      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
        onChangeText={setEmail}
        value={email}
      />
      <Text>Şifre:</Text>
      <TextInput
        secureTextEntry
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
        onChangeText={setPassword}
        value={password}
      />
      <Text>Şifre Tekrar:</Text>
      <TextInput
        secureTextEntry
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
        onChangeText={setConfirmPassword}
        value={confirmPassword}
      />
      <Button title="Kaydet" onPress={handleRegister} />
    </View>
  );
};

export default RegisterScreen;
