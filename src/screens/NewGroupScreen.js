import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { houseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const NewGroupScreen = ({ navigation, route }) => {
  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCreateGroup = async () => {
    if (!houseName.trim()) {
      Alert.alert('Hata', 'Lütfen ev grubu adını giriniz.');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name: houseName.trim(),
        description: '',
        createdBy: user.id
      };

      const response = await houseApi.createHouse(requestData);
      
      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Başarılı', 
          'Ev grubu başarıyla oluşturuldu!',
          [{ text: 'Tamam', onPress: () => navigation.navigate('GroupListScreen') }]
        );
      }
    } catch (error) {
      console.error('Ev grubu oluşturma hatası:', error);
      Alert.alert('Hata', 'Ev grubu oluşturulamadı: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Yeni Ev Grubu</Text>
          <Text style={CommonStyles.subtitle}>Yeni bir ev grubu oluşturun</Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Ev Grubu Adı</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background,
                fontSize: 16,
              }}
              placeholder="Ev grubu adını girin"
              value={houseName}
              onChangeText={setHouseName}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!houseName.trim() || loading) && { opacity: 0.5 }
          ]}
          onPress={handleCreateGroup}
          disabled={!houseName.trim() || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>🏠</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Oluşturuluyor..." : "Ev Grubu Oluştur"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni ev grubunuzu oluşturun</Text>
          </View>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
  }
});

export default NewGroupScreen;
