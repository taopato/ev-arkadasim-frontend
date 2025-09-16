import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, ScrollView } from 'react-native';
import useScrollRestore from '../hooks/useScrollRestore';
import { useAuth } from '../context/AuthContext';
import { houseApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';

export default function GroupListScreen({ navigation, route }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { listRef, handleScroll } = useScrollRestore('GroupListScreen');

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
    navigation.navigate('YeniEvGrubu');
  };

  const handleHousePress = (house) => {
    const redirectTo = route?.params?.redirectTo;
    
    // Yeni harcama ekranları
    if (redirectTo === 'PlanliOdemeler') {
      navigation.navigate('PlanliOdemeler', { houseId: house.id, houseName: house.name });
      return;
    }
    if (redirectTo === 'TumHarcamalar') {
      navigation.navigate('TumHarcamalar', { houseId: house.id, houseName: house.name });
      return;
    }
    if (redirectTo === 'HarcamaOzeti') {
      navigation.navigate('HarcamaOzeti', { houseId: house.id, houseName: house.name });
      return;
    }
    
    // Mevcut ekranlar
    if (redirectTo === 'ExpensesScreen' || redirectTo === 'Harcamalar') {
      navigation.replace('Harcamalar', { houseId: house.id, houseName: house.name });
      return;
    }
    if (redirectTo === 'BillsOverviewScreen' || redirectTo === 'Faturalar') {
      navigation.replace('Faturalar', { houseId: house.id, houseName: house.name });
      return;
    }
    if (redirectTo === 'NewRecurringChargeScreen' || redirectTo === 'DuzenliGiderEkle') {
      navigation.replace('DuzenliGiderEkle', { houseId: house.id, houseName: house.name });
      return;
    }
    if (redirectTo === 'UtilityBillCreate' || redirectTo === 'FaturaOlustur') {
      navigation.replace('FaturaOlustur', { houseId: house.id, houseName: house.name, isEditing: false });
      return;
    }
    if (redirectTo === 'CreatePaymentScreen' || redirectTo === 'OdemeEkle') {
      navigation.replace('OdemeEkle', { houseId: house.id, houseName: house.name });
      return;
    }
    
    // Varsayılan: Ev üyeleri ekranına git
    navigation.navigate('EvUyeleri', {
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
      <ScrollView style={CommonStyles.content} ref={listRef} onScroll={handleScroll} scrollEventThrottle={16}>
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


