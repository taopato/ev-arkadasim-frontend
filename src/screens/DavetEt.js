// src/screens/InviteFriendScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';
import { houseApi } from '../services/api';

const InviteFriendScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const [email, setEmail] = useState('');

  const sendInvite = async () => {
    if (!houseId || !email.trim()) {
      Alert.alert('Hata', 'Ev ve e-posta zorunludur.');
      return;
    }
    try {
      await houseApi.sendInvitation(houseId, email.trim());
      Alert.alert('Başarılı', 'Davet gönderildi.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Davet gönderilemedi');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={CommonStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={CommonStyles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Arkadaş Davet Et</Text>
          <Text style={CommonStyles.subtitle}>{houseName ? `${houseName}` : 'Ev'} • E-posta ile davet</Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={CommonStyles.menuButton} onPress={sendInvite} activeOpacity={0.8}>
            <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
              <Text style={CommonStyles.buttonIcon}>📧</Text>
              <Text style={CommonStyles.buttonText}>Davet Gönder</Text>
              <Text style={CommonStyles.buttonSubtext}>Eve katılmaları için bağlantı gönder</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: Colors.neutral[300], borderRadius: 8,
    padding: 12, backgroundColor: Colors.background, fontSize: 16, color: Colors.text.primary, marginBottom: 16,
  },
});

export default InviteFriendScreen;
