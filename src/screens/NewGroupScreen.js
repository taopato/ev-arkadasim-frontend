import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

const NewGroupScreen = ({ navigation, route }) => {
  const [houseName, setHouseName] = useState('');
  const [userId, setUserId] = useState(1); // Kullanıcının ID'si

  const handleCreateGroup = async () => {
    if (!houseName.trim()) {
      Alert.alert('Hata', 'Grup adı boş bırakılamaz.');
      return;
    }

    try {
      const response = await api.post('/House/CreateHouse', {
        HouseName: houseName,
        UserId: userId,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Başarılı', 'Grup başarıyla oluşturuldu.');

        // Callback ile listeyi güncelle
        if (route.params?.onGroupAdded) {
          route.params.onGroupAdded();
        }

        // "Ev Gruplarım" ekranına geri dön
        navigation.goBack(); // Önceki sayfaya dön (Ev Gruplarım)
      } else {
        Alert.alert('Hata', 'Grup oluşturulamadı. Lütfen bilgileri kontrol edin.');
      }
    } catch (error) {
      console.error('Grup oluşturulurken hata oluştu:', error);
      Alert.alert('Hata', 'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol edin.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yeni Grup Oluştur</Text>
      <TextInput
        style={styles.input}
        placeholder="Grup Adı"
        value={houseName}
        onChangeText={setHouseName}
      />
      <Button title="Oluştur" onPress={handleCreateGroup} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
});

export default NewGroupScreen;
