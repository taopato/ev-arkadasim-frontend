import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';
import eventBus from '../shared/events/bus';

const PendingContributionsScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getPendingPayments(user.id);
      const arr = Array.isArray(res?.data) ? res.data : [];
      setList(arr);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    fetchData();
    const unsub = navigation.addListener('focus', fetchData);
    return unsub;
  }, [fetchData, navigation]);

  const approve = async (p) => {
    try {
      await paymentsApi.approvePayment(p.id, user.id);
      Alert.alert('Başarılı', 'Ödeme onaylandı');
      eventBus.emit('payments:updated', { houseId: p.houseId });
      fetchData();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Onaylanamadı');
    }
  };
  const reject = async (p) => {
    try {
      await paymentsApi.rejectPayment(p.id, '');
      Alert.alert('Bilgi', 'Ödeme reddedildi');
      fetchData();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.message || e?.message || 'Reddedilemedi');
    }
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Bekleyen katkılar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Bekleyen Katkılar</Text>
          <Text style={CommonStyles.subtitle}>{houseName || ''}</Text>
        </View>

        {list.length === 0 ? (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>📭</Text>
            <Text style={CommonStyles.emptyText}>Bekleyen katkı yok</Text>
          </View>
        ) : (
          <View style={CommonStyles.listContainer}>
            {list.map((p) => (
              <View key={String(p.id)} style={CommonStyles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={CommonStyles.listItemTitle}>{p.borcluUserName || `Kullanıcı #${p.borcluUserId}`}</Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    {p.type || ''} • {p.period || ''}
                  </Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Tutar: {Number(p.tutar).toFixed(2)} ₺ • Yöntem: {p.paymentMethod}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => approve(p)} activeOpacity={0.8}>
                    <Text style={styles.smallBtnText}>Onayla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn,{backgroundColor:Colors.error[500]}]} onPress={() => reject(p)} activeOpacity={0.8}>
                    <Text style={styles.smallBtnText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  smallBtn: { backgroundColor: Colors.primary[500], paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: '600' },
});

export default PendingContributionsScreen;


