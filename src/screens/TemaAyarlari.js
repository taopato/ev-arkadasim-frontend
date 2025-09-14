// src/screens/ThemeSettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';

export default function ThemeSettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tema</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.text}>Tema ayarları yakında burada.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[100], marginRight: 8 },
  backIcon: { fontSize: 18, color: Colors.text.primary },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text.primary },
  card: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral[200], padding: 12 },
  text: { color: Colors.text.secondary },
});


