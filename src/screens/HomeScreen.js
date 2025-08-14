import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useUserHouses } from '../features/houses/get-user-houses/hooks';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  // Yeni houses modülü hooks'u kullanıyoruz
  const { data: userHouses = [], isLoading: housesLoading, error, refetch } = useUserHouses(user?.id);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });

    return unsubscribe;
  }, [navigation, refetch]);

  // Hata durumunu kontrol et
  useEffect(() => {
    if (error) {
      console.error('Ev listesi hatası:', error);
    }
  }, [error]);

  const handleButtonPress = (screenName, params = {}) => {
    navigation.navigate(screenName, params);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } finally {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ]
    );
  };

  if (housesLoading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Ev grupları yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Hoş Geldiniz!</Text>
          <Text style={CommonStyles.subtitle}>
            {user?.fullName || 'Kullanıcı'} • {userHouses?.data?.length ?? userHouses.length} ev grubu
          </Text>
        </View>

        {/* Ev Grupları */}
        {(userHouses?.data?.length ?? userHouses.length) > 0 && (
          <View style={CommonStyles.card}>
            <Text style={styles.sectionTitle}>🏠 Ev Gruplarım</Text>
            <View style={CommonStyles.listContainer}>
              {(userHouses.data ?? userHouses).map((house) => (
                <TouchableOpacity
                  key={house.id.toString()}
                  style={CommonStyles.listItem}
                  onPress={() => handleButtonPress('EvGrubuArkadaslarimScreen', {
                    houseId: house.id,
                    houseName: house.name
                  })}
                  activeOpacity={0.8}
                >
                  <View style={styles.houseIconContainer}>
                    <Text style={styles.houseIcon}>🏠</Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>{house.name}</Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      {house.memberCount || 0} üye
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ana Menü Butonları */}
        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📱 Ana Menü</Text>
          
          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => handleButtonPress('GroupListScreen')}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
              <Text style={CommonStyles.buttonIcon}>🏘️</Text>
              <Text style={CommonStyles.buttonText}>Ev Gruplarım</Text>
              <Text style={CommonStyles.buttonSubtext}>Tüm ev gruplarını görüntüle</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => handleButtonPress('NewGroupScreen')}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
              <Text style={CommonStyles.buttonIcon}>➕</Text>
              <Text style={CommonStyles.buttonText}>Yeni Grup Oluştur</Text>
              <Text style={CommonStyles.buttonSubtext}>Yeni ev grubu ekle</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => handleButtonPress('PaymentApproval')}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
              <Text style={CommonStyles.buttonIcon}>⏳</Text>
              <Text style={CommonStyles.buttonText}>Bekleyen Ödemeler</Text>
              <Text style={CommonStyles.buttonSubtext}>Onay bekleyen ödemeler</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={CommonStyles.menuButton}
            onPress={() => handleButtonPress('CreatePayment')}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
              <Text style={CommonStyles.buttonIcon}>💳</Text>
              <Text style={CommonStyles.buttonText}>Ödeme Yap</Text>
              <Text style={CommonStyles.buttonSubtext}>Arkadaşınıza ödeme yapın</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Çıkış Butonu */}
        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.error.background }]}>
            <Text style={CommonStyles.buttonIcon}>🚪</Text>
            <Text style={CommonStyles.buttonText}>Çıkış Yap</Text>
            <Text style={CommonStyles.buttonSubtext}>Hesabınızdan çıkış yapın</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  houseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  houseIcon: {
    fontSize: 24,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: Colors.text.secondary,
  },
});

export default HomeScreen;
