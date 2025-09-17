import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { houseApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

export default function AlacakBorcIcmiScreen({ route, navigation }) {
  const { userId, houseId, userName } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await houseApi.getUserDebts(userId, houseId);
      setData(response.data);
    } catch (error) {
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        {loading ? (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={CommonStyles.loadingText}>Borç/Alacak bilgileri yükleniyor...</Text>
          </View>
        ) : (
          <>
            <View style={CommonStyles.header}>
              <Text style={CommonStyles.title}>Borç/Alacak Detayı</Text>
              <Text style={CommonStyles.subtitle}>{userName || 'Kullanıcı'} - Borç ve alacak durumu</Text>
            </View>

            <View style={CommonStyles.card}>
              <View style={styles.amountContainer}>
                <View style={[styles.amountItem, { backgroundColor: Colors.success[50] }]}> 
                  <Text style={styles.amountLabel}>Toplam Alacak</Text>
                  <Text style={styles.alacak}>{data?.data?.toplamAlacak || 0} TL</Text>
                </View>
                <View style={[styles.amountItem, { backgroundColor: Colors.error[50] }]}>
                  <Text style={styles.amountLabel}>Toplam Borç</Text>
                  <Text style={styles.borc}>{data?.data?.toplamBorc || 0} TL</Text>
                </View>
                <View style={[styles.amountItem, { backgroundColor: Colors.primary[50] }]}>
                  <Text style={styles.amountLabel}>Net Durum</Text>
                  <Text style={styles.netDurum}>{data?.data?.netDurum || 0} TL</Text>
                </View>
              </View>
            </View>

            <View style={CommonStyles.listContainer}>
              {(data?.data?.detaylar || []).map((item, index) => (
                <View key={index} style={CommonStyles.listItem}>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>{item.tur}</Text>
                    <View style={styles.amounts}>
                      <Text style={styles.alacak}>Tutar: {item.tutar} TL</Text>
                      <Text style={styles.borc}>Paylaşım: {item.paylasimTutari} TL</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  amountContainer: { gap: 12 },
  amountItem: { padding: 16, borderRadius: 8, alignItems: 'center' },
  amountLabel: { fontSize: 14, color: Colors.text.secondary, marginBottom: 4 },
  alacak: { color: Colors.success[600], fontSize: 18, fontWeight: 'bold' },
  borc: { color: Colors.error[600], fontSize: 18, fontWeight: 'bold' },
  netDurum: { color: Colors.primary[600], fontSize: 18, fontWeight: 'bold' },
  amounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});


