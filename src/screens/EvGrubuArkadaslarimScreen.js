import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

const EvGrubuArkadaslarimScreen = ({ route, navigation }) => {
  // route.params'tan houseId parametresini al
  const { houseId } = route.params || {}; // Varsayılan değer ekledik

  // Eğer houseId yoksa hata mesajı ver ve geri dön
  if (!houseId) {
    Alert.alert("Hata", "Geçerli bir ev ID'si bulunamadı.");
    navigation.goBack(); // Geri dön
    return null; // Boş bir ekran göster
  }

  const [friends, setFriends] = useState([]); // Ev arkadaşları listesi
  const [loading, setLoading] = useState(false); // Yüklenme durumu

  // İlk render sırasında ev arkadaşlarını getir
  useEffect(() => {
    fetchFriends();
  }, []);

  // Ev arkadaşlarını sunucudan al
  const fetchFriends = async () => {
    setLoading(true); // Yüklenme durumunu başlat
    try {
      const response = await api.get(`/House/Friends/${houseId}`);
      if (response.data && Array.isArray(response.data)) {
        setFriends(response.data); // Arkadaş listesini güncelle
      } else {
        setFriends([]); // Veri yoksa boş liste
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Ev arkadaşları alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false); // Yüklenme durumunu bitir
    }
  };

  // Bir arkadaşa tıklanınca yapılacak işlem
  const handleFriendPress = (friend) => {
    navigation.navigate('AlacakBorcIcmiScreen', { userId: friend.id }); // Borç/Alacak ekranına yönlendir
  };

  // Harcama ekleme ekranına geçiş
  const handleAddExpense = () => {
    navigation.navigate('HarcamaEkleScreen', { houseId }); // Harcama ekleme ekranına houseId gönder
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ev Arkadaşlarım</Text>
      {/* Harcama ekleme butonu */}
      <Button title="Harcama Ekle" onPress={handleAddExpense} />
      {/* Yüklenme durumunda gösterilecek gösterge */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={friends} // Arkadaş listesini ver
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : index.toString()
          } // Her bir öğeye benzersiz bir anahtar
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleFriendPress(item)} // Arkadaşa tıklandığında
            >
              <Text style={styles.name}>
                {item.fullName} {item.isUser && '(Siz)'}
              </Text>
              <View style={styles.amounts}>
                <Text style={styles.alacak}>Alacağı: {item.alacak || 0} TL</Text>
                <Text style={styles.borc}>Borcu: {item.borc || 0} TL</Text>
              </View>
            </TouchableOpacity>
          )}
          // Liste boşsa gösterilecek metin
          ListEmptyComponent={
            <Text style={styles.emptyText}>Ev arkadaşlarınız bulunmamaktadır.</Text>
          }
        />
      )}
    </View>
  );
};

// Stil dosyası
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  alacak: {
    color: 'green',
    fontWeight: 'bold',
  },
  borc: {
    color: 'red',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
});

export default EvGrubuArkadaslarimScreen;
