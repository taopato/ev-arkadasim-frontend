import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { houseApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

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
    setLoading(true);
    try {
      const response = await houseApi.getUserHouses(user.id);
      
      if (response.data && Array.isArray(response.data)) {
        setHouses(response.data);
      } else {
        console.error('Gelen veri array değil:', typeof response.data);
        setHouses([]);
      }
    } catch (error) {
      console.error('Ev grupları alınamadı:', error);
      setHouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHouse = () => {
    navigation.navigate('NewGroupScreen');
  };

  const handleHousePress = (house) => {
    navigation.navigate('EvGrubuArkadaslarimScreen', {
      houseId: house.id,
      houseName: house.name
    });
  };

  const renderHouseItem = ({ item }) => (
    <TouchableOpacity
      style={[CommonStyles.menuButton]}
      onPress={() => handleHousePress(item)}
      activeOpacity={0.8}
    >
      <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
        <Text style={CommonStyles.buttonIcon}>🏠</Text>
        <Text style={CommonStyles.buttonText}>{item.name}</Text>
        <Text style={CommonStyles.buttonSubtext}>
          Oluşturulma: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Ev Gruplarım</Text>
          <Text style={CommonStyles.subtitle}>Ev gruplarınızı görüntüleyin ve yönetin</Text>
        </View>
        
        <TouchableOpacity
          style={[CommonStyles.menuButton]}
          onPress={handleCreateHouse}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>➕</Text>
            <Text style={CommonStyles.buttonText}>Yeni Ev Grubu Oluştur</Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni bir ev grubu oluşturun</Text>
          </View>
        </TouchableOpacity>
        
        {loading ? (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={CommonStyles.loadingText}>Ev grupları yükleniyor...</Text>
          </View>
        ) : houses.length > 0 ? (
          <View style={CommonStyles.listContainer}>
            {houses.map((item) => (
              <View key={item.id.toString()}>
                {renderHouseItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>🏠</Text>
            <Text style={CommonStyles.emptyText}>Henüz bir ev grubunuz bulunmamaktadır.</Text>
            <Text style={CommonStyles.emptyText}>İlk ev grubunuzu oluşturmak için yukarıdaki butona tıklayın.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


