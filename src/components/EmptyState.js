// src/components/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const EmptyState = ({ icon = '📭', title = 'Kayıt yok', subtitle }) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  icon: { fontSize: 42, marginBottom: 6 },
  title: { fontWeight: '900', color: Colors.text.primary },
  sub: { color: Colors.text.secondary, marginTop: 4, textAlign: 'center' },
});

export default EmptyState;
