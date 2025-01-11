import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

function AddHousemateScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const addHousemate = async () => {
    try {
      const response = await api.post('/Housemates', { name, email, phoneNumber });
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Başarılı', 'Ev arkadaşı başarıyla eklendi!');
        setName('');
        setEmail('');
        setPhoneNumber('');
      } else {
        Alert.alert('Hata', 'Ev arkadaşı eklenemedi. Lütfen bilgileri kontrol edin.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol edin.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ev Arkadaşı Ekle</Text>
      <TextInput
        style={styles.input}
        placeholder="Ev arkadaşı adı"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="E-posta adresi"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Telefon numarası"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <Button title="Ekle" onPress={addHousemate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});

export default AddHousemateScreen;
