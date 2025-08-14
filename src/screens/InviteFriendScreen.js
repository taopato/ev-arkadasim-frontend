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

const InviteFriendScreen = ({ navigation, route }) => {
  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Arkadaş Davet Et</Text>
          <Text style={CommonStyles.subtitle}>
            Bu özellik yakında eklenecek
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={styles.infoText}>
            📧 Arkadaş davet etme özelliği geliştirme aşamasındadır.
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
    textAlign: 'center',
  },
});

export default InviteFriendScreen; 
