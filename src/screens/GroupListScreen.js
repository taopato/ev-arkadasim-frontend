import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

export default function GroupListScreen({ navigation }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const response = await api.get('/House/User/1'); // Kullanıcı ID'si backend'den alınmalı
      setHouses(response.data);
    } catch (error) {
      Alert.alert('Hata', 'Ev bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ev Gruplarım</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={houses}
          keyExtractor={(item) => item.houseId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('EvGrubuArkadaslarimScreen', { houseId: item.houseId })
              }
            >
              <Text style={styles.name}>{item.houseName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f8f8' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  card: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
});
