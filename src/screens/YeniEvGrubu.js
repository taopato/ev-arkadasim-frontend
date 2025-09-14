// src/screens/NewGroupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { houseApi } from '../services/api';

const NewGroupScreen = ({ navigation }) => {
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
      await houseApi.createHouse({ name: houseName.trim(), description: '', createdBy: user?.id });
      Alert.alert('Başarılı', 'Ev grubu oluşturuldu.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <View style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Yeni Ev Grubu</Text>
          <Text style={CommonStyles.subtitle}>Ev arkadaşlarınla harcamaları yönet</Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.label}>Ev Grubu Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 3. Kat 5 No Daire"
            value={houseName}
            onChangeText={setHouseName}
          />

          <TouchableOpacity
            style={[CommonStyles.menuButton, (!houseName.trim() || loading) && { opacity: 0.5 }]}
            onPress={handleCreateGroup}
            disabled={!houseName.trim() || loading}
            activeOpacity={0.8}
          >
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={CommonStyles.buttonIcon}>🏠</Text>
                  <Text style={CommonStyles.buttonText}>Oluştur</Text>
                  <Text style={CommonStyles.buttonSubtext}>Yeni ev grubunu kaydet</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={CommonStyles.menuButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
              <Text style={CommonStyles.buttonIcon}>🔙</Text>
              <Text style={CommonStyles.buttonText}>Geri Dön</Text>
              <Text style={CommonStyles.buttonSubtext}>Önceki sayfa</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 8,
    padding: 12, backgroundColor: Colors.background, fontSize: 16, color: Colors.text.primary, marginBottom: 16,
  },
});

export default NewGroupScreen;
