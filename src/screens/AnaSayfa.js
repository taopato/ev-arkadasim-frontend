// src/screens/HomeScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useTheme } from '../shared/theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { HeroHeader } from '../shared/ui/premium/HeroHeader';
import { WeekStrip } from '../shared/ui/premium/WeekStrip';
import { expensesApi } from '../services/api';
import { normalizeExpense } from '../utils/expenseClassifier';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const pastelKeys = ['blue','green','purple','orange','pink'];
  const NavButton = ({ title, subtitle, onPress, emoji, idx = 0 }) => (
    <TouchableOpacity style={[styles.btnCard, { backgroundColor: theme.colors.pastel[pastelKeys[idx % pastelKeys.length]].bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.btnCardInner}>
        <Text style={styles.btnIcon}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.btnText, { color: theme.colors.pastel[pastelKeys[idx % pastelKeys.length]].fg }]} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={[styles.btnSubSmall, { color: theme.colors.pastel[pastelKeys[idx % pastelKeys.length]].fg, opacity: 0.85 }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const loadWeekly = async () => {
      try {
        const houseId = user?.defaultHouseId;
        if (!houseId) return;
        const res = await expensesApi.getByHouse(houseId);
        const data = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(data) ? data.map(normalizeExpense) : [];
        const now = new Date();
        const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const day = monday.getUTCDay();
        const diff = (day + 6) % 7;
        monday.setUTCDate(monday.getUTCDate() - diff);
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 7);
        let sum = 0;
        for (const it of list) {
          const v = it?.date || it?._raw?.kayitTarihi || it?._raw?.postDate || it?.createdDate;
          const d = new Date(v || 0);
          if (d >= monday && d < sunday) sum += Number(it.amount || 0);
        }
        setWeeklyTotal(sum);
      } catch {}
    };
    loadWeekly();
  }, [user?.defaultHouseId]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount || 0));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <HeroHeader
          title="Toplam harcama (haftalık)"
          subtitle={`Merhaba, ${user?.fullName || 'Kullanıcı'} 👋`}
          amount={formatCurrency(weeklyTotal)}
          primaryLabel="+ Ekle"
          onPrimaryAction={() => setBillModalVisible(true)}
        />

        <WeekStrip selectedKey={selectedDayKey || undefined} onSelect={(k) => setSelectedDayKey(k)} />

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={[styles.sub, { color: theme.colors.text.secondary }]}>Hızlı işlemler</Text>

          <View style={styles.grid}>
          <View style={[styles.gridItemFull]}>
            <NavButton
              title="Evlerim"
              subtitle="Üye olduğum evler"
              emoji="🏘️"
              onPress={() => navigation.navigate('GrupListesi')}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Faturalar (Planlı)"
              subtitle="Bu ay ödenecekler"
              emoji="📅"
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'BillsOverviewScreen' });
              }}
              idx={0}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Harcamalar (Serbest)"
              subtitle="Tam hareket dökümü"
              emoji="📋"
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'TumHarcamalar' });
              }}
              idx={1}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Analitik"
              subtitle="Grafikler & özetler"
              emoji="📊"
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'HarcamaOzeti' });
              }}
              idx={2}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Ödemeler"
              subtitle="Tüm ödemeleri incele"
              emoji="💳"
              onPress={() => {
                navigation.navigate('Odemeler');
              }}
              idx={3}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Borç–Alacak"
              subtitle="Net bakiyeler"
              emoji="💰"
              onPress={() => {
                navigation.navigate('GrupListesi', { redirectTo: 'DebtSummaryScreen' });
              }}
              idx={4}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Bekleyen İşlemler"
              subtitle="Onay bekleyenler"
              emoji="⏳"
              onPress={() => navigation.navigate('BekleyenOdemeler', { userId: user?.id })}
              idx={5}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Ayarlar"
              subtitle="Uygulama ve hesap"
              emoji="⚙️"
              onPress={() => navigation.navigate('Ayarlar')}
              idx={6}
            />
          </View>
          <View style={styles.gridItem}>
            <NavButton
              title="Davet Et"
              subtitle="Arkadaş ekle"
              emoji="📨"
              onPress={() => navigation.navigate('DavetEt', { houseId: user?.defaultHouseId })}
              idx={7}
            />
          </View>
        </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.error?.[600] }]}
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
            <Text style={[styles.btnText, { color: theme.colors.text.onPrimary }]}>Çıkış Yap</Text>
          </View>
        </TouchableOpacity>

        <Modal
          visible={billModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBillModalVisible(false)}
        >
          <View style={[styles.sheetBackdrop]}>
            <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.colors.neutral?.[300] }]} />
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Düzenli Gider Ekle</Text>
              <Text style={[styles.modalSub, { color: theme.colors.text.secondary }]}>Kira, internet veya abonelik</Text>
              <View style={{ gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: theme.colors.primary?.[600] }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setBillModalVisible(false);
                    const hid = user?.defaultHouseId;
                    if (hid) navigation.navigate('DuzenliGiderEkle', { houseId: hid, houseName: 'Ev', defaultMode: 'recurring' });
                    else navigation.navigate('GrupListesi', { redirectTo: 'DuzenliGiderEkle' });
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: theme.colors.text.onPrimary }]}>Düzenli Gider</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: theme.colors.neutral?.[300] }]}
                  activeOpacity={0.85}
                  onPress={() => setBillModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: theme.colors.text.primary }]}>İptal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  hello: { fontSize: 22, fontWeight: '900', color: theme.colors.text.primary },
  sub: { color: theme.colors.text.secondary, marginBottom: 12 },
  btn: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.neutral?.[200], marginBottom: 12 },
  btnInner: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnInnerSmall: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnIcon: { fontSize: 22, marginRight: 8 },
  btnText: { fontWeight: '900', color: theme.colors.text.primary },
  btnSub: { color: theme.colors.text.secondary, marginTop: 2 },
  btnSubSmall: { color: theme.colors.text.onPrimary, marginTop: 2, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
  gridItemFull: { width: '100%' },
  btnCard: { borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.neutral?.[200] },
  btnCardInner: { height: 86, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetBackdrop: { flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, backgroundColor: theme.colors.neutral?.[300], borderRadius: 3, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
  modalSub: { color: theme.colors.text.secondary, marginTop: 4 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { color: theme.colors.text?.onPrimary, fontWeight: '700' },
});

export default HomeScreen;
