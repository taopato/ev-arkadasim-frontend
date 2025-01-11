import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleSendCode = () => {
    Alert.alert('Kod Gönderildi', 'Lütfen e-postanızı kontrol ediniz.');
    navigation.navigate('VerifyCode');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>E-posta Adresiniz:</Text>
      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
        onChangeText={setEmail}
        value={email}
      />
      <Button title="Gönder" onPress={handleSendCode} />
    </View>
  );
};

export default ForgotPasswordScreen;
