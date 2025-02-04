import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GroupListScreen({ navigation }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    fetchHouses();
  }, [user]);

  const fetchHouses = async () => {
    try {
      console.log('Ev grupları getiriliyor. Kullanıcı ID:', user.id);
      const response = await api.get(`/House/User/${user.id}`);
      console.log('Gelen ev grupları (detaylı):', JSON.stringify(response.data, null, 2));
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Ev grupları dizisi uzunluğu:', response.data.length);
        console.log('İlk ev grubu örneği:', response.data[0]);
        setHouses(response.data);
        
        if (response.data.length === 0) {
          Alert.alert('Bilgi', 'Henüz bir ev grubunuz bulunmamaktadır.');
        }
      } else {
        console.log('Gelen veri array değil:', typeof response.data);
        setHouses([]);
        Alert.alert('Bilgi', 'Ev grupları verisi beklenen formatta değil.');
      }
    } catch (error) {
      console.error('Ev grupları getirilirken hata:', error);
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz bir ev grubunuz bulunmamaktadır.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: "#f8f8f8" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 16 
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  }
});
