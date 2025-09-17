// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [billModalVisible, setBillModalVisible] = useState(false);

  const NavButton = ({ title, subtitle, onPress, emoji, color }) => (
    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.btnInnerSmall}>
        <Text style={styles.btnIcon}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.btnText, { color: '#fff' }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.btnSubSmall]}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.hello}>Merhaba, {user?.fullName || 'Kullanıcı'} 👋</Text>
        <Text style={styles.sub}>Hızlı işlemler</Text>

        <View style={styles.grid}>
          <View style={[styles.gridItemFull]}>
            <NavButton
              title="Evlerim"
              subtitle="Üye olduğum evler"
              emoji="🏘️"
              color={Colors.primary[600]}
              onPress={() => navigation.navigate('GrupListesi')}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Faturalar (Planlı)"
              subtitle="Bu ay ödenecekler"
              emoji="📅"
              color={Colors.warning[600]}
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'BillsOverviewScreen' });
              }}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Harcamalar (Serbest)"
              subtitle="Tam hareket dökümü"
              emoji="📋"
              color={Colors.info[600]}
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'TumHarcamalar' });
              }}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Analitik"
              subtitle="Grafikler & özetler"
              emoji="📊"
              color={Colors.success[600]}
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'HarcamaOzeti' });
              }}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Ödemeler"
              subtitle="Tüm ödemeleri incele"
              emoji="💳"
              color={Colors.success[600]}
              onPress={() => {
                navigation.navigate('Odemeler');
              }}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Borç–Alacak"
              subtitle="Net bakiyeler"
              emoji="💰"
              color={Colors.info[600]}
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'DebtSummaryScreen' });
              }}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Bekleyen İşlemler"
              subtitle="Onay bekleyenler"
              emoji="⏳"
              color={Colors.neutral[600]}
              onPress={() => navigation.navigate('BekleyenOdemeler', { userId: user?.id })}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Ayarlar"
              subtitle="Uygulama ve hesap"
              emoji="⚙️"
              color={Colors.neutral[600]}
              onPress={() => navigation.navigate('Ayarlar')}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Davet Et"
              subtitle="Arkadaş ekle"
              emoji="📨"
              color={Colors.info[500]}
              onPress={() => navigation.navigate('DavetEt', { houseId: user?.defaultHouseId })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.error[600] }]}
          onPress={async () => {
            try {
              await logout();
            } finally {
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
          }}
          activeOpacity={0.85}
        >
          <View style={styles.btnInner}>
            <Text style={styles.btnIcon}>🚪</Text>
            <Text style={[styles.btnText, { color: '#fff' }]}>Çıkış Yap</Text>
          </View>
        </TouchableOpacity>

        <Modal
          visible={billModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBillModalVisible(false)}
        >
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.modalTitle}>Düzenli Gider Ekle</Text>
              <Text style={styles.modalSub}>Kira, internet veya abonelik</Text>
              <View style={{ gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary[600] }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setBillModalVisible(false);
                    const hid = user?.defaultHouseId;
                    if (hid) navigation.navigate('DuzenliGiderEkle', { houseId: hid, houseName: 'Ev', defaultMode: 'recurring' });
                    else navigation.navigate('GrupListesi', { redirectTo: 'DuzenliGiderEkle' });
                  }}
                >
                  <Text style={styles.modalBtnText}>Düzenli Gider</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.neutral[300] }]}
                  activeOpacity={0.85}
                  onPress={() => setBillModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: Colors.text.primary }]}>İptal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  hello: { fontSize: 22, fontWeight: '900', color: Colors.text.primary },
  sub: { color: Colors.text.secondary, marginBottom: 12 },
  btn: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral[200], marginBottom: 12 },
  btnInner: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnInnerSmall: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnIcon: { fontSize: 22, marginRight: 8 },
  btnText: { fontWeight: '900', color: Colors.text.primary },
  btnSub: { color: Colors.text.secondary, marginTop: 2 },
  btnSubSmall: { color: '#ffffffcc', marginTop: 2, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
  gridItemFull: { width: '100%' },
  sheetBackdrop: { flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, backgroundColor: Colors.neutral[300], borderRadius: 3, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  modalSub: { color: Colors.text.secondary, marginTop: 4 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});

export default HomeScreen;
