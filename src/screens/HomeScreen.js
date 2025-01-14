import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Ev Arkadaşlarım */}
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('EvArkadaslarim')}>
        <Text style={styles.headerButtonText}>Ev Arkadaşlarım</Text>
      </TouchableOpacity>

      {/* Orta Bölüm */}
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Harcama')}>
          <Text style={styles.gridButtonText}>Harcama</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('BorcOdeme')}>
          <Text style={styles.gridButtonText}>Borç Ödeme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Kira')}>
          <Text style={styles.gridButtonText}>Kira</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Aidat')}>
          <Text style={styles.gridButtonText}>Aidat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Elektrik')}>
          <Text style={styles.gridButtonText}>Elektrik</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Su')}>
          <Text style={styles.gridButtonText}>Su</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Dogalgaz')}>
          <Text style={styles.gridButtonText}>Doğalgaz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridButton} onPress={() => navigation.navigate('Internet')}>
          <Text style={styles.gridButtonText}>İnternet</Text>
        </TouchableOpacity>
      </View>

      {/* Alt Bölüm */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={[styles.footerButton, styles.greenButton]} onPress={() => navigation.navigate('Alacaklarim')}>
          <Text style={styles.footerButtonText}>Alacaklarım</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerButton, styles.redButton]} onPress={() => navigation.navigate('Borclarim')}>
          <Text style={styles.footerButtonText}>Borçlarım</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerButton: {
    backgroundColor: '#b0bec5',
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtonText: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly' },
  gridButton: {
    width: '40%',
    backgroundColor: '#90caf9',
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  gridButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  footerContainer: { flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 },
  footerButton: { padding: 15, borderRadius: 10, width: '40%', alignItems: 'center' },
  greenButton: { backgroundColor: '#4caf50' },
  redButton: { backgroundColor: '#f44336' },
  footerButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default HomeScreen;
