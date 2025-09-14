// src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ayarlar</Text>
        <Text style={styles.sub}>Hesap: {user?.fullName || user?.email || '—'}</Text>

        <TouchableOpacity
          style={[styles.rowBtn]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('LanguageSettingsScreen')}
        >
          <Text style={styles.rowTitle}>Dil</Text>
          <Text style={styles.rowDesc}>Uygulama dili</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowBtn]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ThemeSettingsScreen')}
        >
          <Text style={styles.rowTitle}>Tema</Text>
          <Text style={styles.rowDesc}>Aydınlık/Karanlık</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowBtn, { backgroundColor: Colors.error[50], borderColor: Colors.error[500] }]}
          activeOpacity={0.85}
          onPress={async () => {
            try {
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) {
              Alert.alert('Hata', 'Çıkış yapılamadı');
            }
          }}
        >
          <Text style={[styles.rowTitle, { color: Colors.error[600] }]}>Çıkış Yap</Text>
          <Text style={[styles.rowDesc, { color: Colors.error[600] }]}>Oturumu kapat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 16 },
  card: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral[200], padding: 12 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.text.primary },
  sub: { color: Colors.text.secondary, marginTop: 4, marginBottom: 10 },
  rowBtn: { borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: 10, padding: 12, marginTop: 10 },
  rowTitle: { fontWeight: '800', color: Colors.text.primary },
  rowDesc: { color: Colors.text.secondary, marginTop: 2 },
});


