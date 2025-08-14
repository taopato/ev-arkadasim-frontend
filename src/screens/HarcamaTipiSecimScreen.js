import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const HarcamaTipiSecimScreen = ({ navigation, route }) => {
  const { expenseType, amount, payerId, houseId, houseName, kaydedenUserId } = route.params || {};

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Tipi Seçimi</Text>
          <Text style={CommonStyles.subtitle}>
            Bu özellik yakında eklenecek
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.infoText}>
            📋 Harcama tipi seçimi özelliği geliştirme aşamasındadır.
          </Text>
          
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Harcama Türü:</Text> {expenseType}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Tutar:</Text> {amount} ₺
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Ödeyen ID:</Text> {payerId}
          </Text>
        </View>

        <TouchableOpacity 
          style={CommonStyles.menuButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
            <Text style={CommonStyles.buttonIcon}>🔙</Text>
            <Text style={CommonStyles.buttonText}>Geri Dön</Text>
            <Text style={CommonStyles.buttonSubtext}>Önceki sayfaya dön</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  infoText: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
});

export default HarcamaTipiSecimScreen;
