import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const ChargesListScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Gider Dönemleri</Text>
          <Text style={CommonStyles.subtitle}>{houseName || ''}</Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.sectionTitle}>📄 Bu ekran yakında</Text>
          <Text style={{ color: Colors.text.secondary }}>
            Gider sözleşmeleri ve dönemler burada listelenecek. Şimdilik Bekleyen Katkılar üzerinden
            onay/red işlemlerine devam edebilirsiniz.
          </Text>
        </View>

        <TouchableOpacity style={CommonStyles.menuButton} onPress={() => navigation.navigate('PaymentApproval', { houseId, houseName })} activeOpacity={0.8}>
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
            <Text style={CommonStyles.buttonIcon}>⏳</Text>
            <Text style={CommonStyles.buttonText}>Bekleyen Katkılar</Text>
            <Text style={CommonStyles.buttonSubtext}>Onay bekleyen ödemeleri gör</Text>
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
});

export default ChargesListScreen;


