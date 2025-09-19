// src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../shared/theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.neutral?.[200] }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Ayarlar</Text>
        <Text style={[styles.sub, { color: theme.colors.text.secondary }]}>Hesap: {user?.fullName || user?.email || '—'}</Text>

        <TouchableOpacity
          style={[styles.rowBtn, { borderColor: theme.colors.neutral?.[200] }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ThemeSettingsScreen')}
        >
          <Text style={[styles.rowTitle, { color: theme.colors.text.primary }]}>Tema</Text>
          <Text style={[styles.rowDesc, { color: theme.colors.text.secondary }]}>Aydınlık/Karanlık</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.error?.[600] }]}
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
          <Text style={[styles.rowTitle, { color: theme.colors.error?.[600] }]}>Çıkış Yap</Text>
          <Text style={[styles.rowDesc, { color: theme.colors.error?.[600] }]}>Oturumu kapat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 12 },
  title: { fontSize: 20, fontWeight: '900' },
  sub: { marginTop: 4, marginBottom: 10 },
  rowBtn: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 10 },
  rowTitle: { fontWeight: '800' },
  rowDesc: { marginTop: 2 },
});


