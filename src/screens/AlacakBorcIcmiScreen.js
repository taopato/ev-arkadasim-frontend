import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import api from '../services/api';

export default function AlacakBorcIcmiScreen({ route, navigation }) {
  const { userId } = route.params; // Seçilen kullanıcının ID'si
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/House/FriendsDetails/${userId}`);
      setData(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriend = () => {
    if (data.user.alacak > 0 || data.user.borc > 0) {
      Alert.alert(
        'Uyarı',
        'Bu kullanıcı alacaklı veya borçlu. Silmek istediğinizden emin misiniz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Sil',
            onPress: async () => {
              try {
                await api.delete(`/House/DeleteFriend/${userId}`);
                Alert.alert('Başarılı', 'Kullanıcı başarıyla silindi.');
                navigation.goBack();
              } catch (error) {
                Alert.alert('Hata', 'Kullanıcı silinemedi.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Uyarı', 'Kullanıcı alacaklı veya borçlu değil, doğrudan silinebilir.');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>
            {data?.user?.fullName} {data?.user?.isCurrentUser && '(Siz)'}
          </Text>
          <View style={styles.amountContainer}>
            <Text style={styles.alacak}>Alacağı: {data?.user?.alacak} TL</Text>
            <Text style={styles.borc}>Borcu: {data?.user?.borc} TL</Text>
          </View>
          <FlatList
            data={data?.friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>
                  {item.fullName} {item.isCurrentUser && '(Siz)'}
                </Text>
                <View style={styles.amounts}>
                  <Text style={styles.alacak}>
                    Alacağı: {item.alacak} TL
                  </Text>
                  <Text style={styles.borc}>
                    Borcu: {item.borc} TL
                  </Text>
                </View>
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteFriend}
          >
            <Text style={styles.deleteButtonText}>Ev Arkadaşı Sil</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f8f8' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  amountContainer: { marginBottom: 16 },
  alacak: { color: 'green', fontSize: 16, fontWeight: 'bold' },
  borc: { color: 'red', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  amounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  deleteButton: {
    backgroundColor: 'red',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  deleteButtonText: { color: 'white', fontWeight: 'bold' },
});
