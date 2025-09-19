// src/screens/PaymentsScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { houseApi, paymentsApi } from '../services/api';
import { getAllUsers } from '../features/users/get-users/api';
import { useAuth } from '../context/AuthContext';
import eventBus from '../shared/events/bus';
import useScrollRestore from '../hooks/useScrollRestore';
import { useTheme } from '../shared/theme/ThemeProvider';

const PaymentsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { houseId: routeHouseId } = route.params || {};
  const houseId = routeHouseId || user?.defaultHouseId;

  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // all | mine | incoming | member
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const { listRef, handleScroll } = useScrollRestore(`PaymentsScreen:${houseId ?? 'all'}`);

  const normalizeStatus = (raw) => {
    const s = (raw ?? '').toString().toLowerCase();
    if (s.includes('onay')) return 'Approved';
    if (s.includes('red')) return 'Rejected';
    if (s.includes('bekle')) return 'Pending';
    if (s.includes('approve')) return 'Approved';
    if (s.includes('reject')) return 'Rejected';
    if (s.includes('pend')) return 'Pending';
    return (raw || 'Pending');
  };

  const asArray = (maybe) => Array.isArray(maybe) ? maybe : [];

  const load = async () => {
    setLoading(true);
    try {
      let list = [];
      if (houseId) {
        // Tek ev için ödemeler
        const res = await paymentsApi.getByHouse(houseId);
        const raw = res?.data;
        list = raw?.data ?? raw?.items ?? raw?.records ?? raw?.payments ?? raw ?? [];
      } else if (user?.id) {
        // Tüm evlerde kullanıcının dahil olduğu ödemeler
        const housesRes = await houseApi.getUserHouses(user.id);
        const houses = asArray(housesRes?.data);
        const all = [];
        for (const h of houses) {
          try {
            const pr = await paymentsApi.getByHouse(h.id);
            const raw = pr?.data;
            const arr = raw?.data ?? raw?.items ?? raw?.records ?? raw?.payments ?? raw ?? [];
            all.push(...asArray(arr));
          } catch {}
        }
        list = all;
      }
      
      // Backend API yapısına göre normalize et
      list = asArray(list).map((item) => {
        const status = normalizeStatus(item.onayDurumu ?? item.Durum ?? item.status);
        const amount = Number(item.tutar ?? item.Tutar ?? item.amount ?? 0);
        const date = item.odemeTarihi || item.OdemeTarihi || item.date || item.createdAt || item.updatedAt;
        const payerName = item.borcluUserName || item.BorcluUserName || item.payerName || item.borcluKullaniciAdi || item.fromUser?.fullName || 'Bilinmeyen';
        const toName = item.alacakliUserName || item.AlacakliUserName || item.toUserName || item.alacakliKullaniciAdi || item.toUser?.fullName || 'Bilinmeyen';
        const note = item.aciklama || item.Aciklama || item.note || item.description || '';
        const id = item.id ?? item.paymentId;
        const paymentMethod = item.paymentMethod || item.PaymentMethod || 'Cash';
        
        console.log('Payment item:', { 
          id, 
          borcluUserName: item.borcluUserName, 
          alacakliUserName: item.alacakliUserName,
          borcluUserId: item.borcluUserId,
          alacakliUserId: item.alacakliUserId,
          payerName, 
          toName 
        });
        
        return { 
          id, 
          status, 
          amount, 
          date, 
          payerName, 
          toName, 
          note, 
          paymentMethod,
          payerId: item.borcluUserId || item.BorcluUserId || item.payerUserId || item.fromUserId, 
          toId: item.alacakliUserId || item.AlacakliUserId || item.toUserId 
        };
      });
      
      // Tüm listeyi sakla (filtreler bu liste üstünden çalışacak)
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setAllItems(list);
      
      // Üyeleri yükle (filtre ve isim eşlemesi için)
      if (houseId) {
        try {
          const mRes = await houseApi.getMembers(houseId);
          const mList = asArray(mRes?.data).map((m) => ({
            id: m.userId || m.id,
            name: m.name || m.fullName || 'İsimsiz Kullanıcı',
          }));
          setMembers(mList);
        } catch {}
      } else {
        // Ev seçilmemişse sistemdeki tüm kullanıcıları al ve isim haritası olarak kullan
        try {
          const all = await getAllUsers();
          const mList = asArray(all).map((u) => ({ id: u.id, name: u.fullName || 'İsimsiz Kullanıcı' }));
          setMembers(mList);
        } catch {}
      }
    } catch (e) {
      console.error('PaymentsScreen load error:', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [houseId]);

  useEffect(() => {
    const off1 = eventBus.on('payments:updated', load);
    const off2 = eventBus.on('expenses:updated', load);
    return () => { off1?.(); off2?.(); };
  }, [houseId]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(allItems)) return [];
    if (filterMode === 'mine' && user?.id) {
      return allItems.filter(x => Number(x.payerId) === Number(user.id));
    }
    if (filterMode === 'incoming' && user?.id) {
      return allItems.filter(x => Number(x.toId) === Number(user.id));
    }
    if (filterMode === 'member' && selectedMemberId) {
      return allItems.filter(x => Number(x.payerId) === Number(selectedMemberId) || Number(x.toId) === Number(selectedMemberId));
    }
    return allItems;
  }, [allItems, filterMode, selectedMemberId, user?.id]);

  useEffect(() => {
    setItems(filteredItems);
  }, [filteredItems]);

  const renderItem = ({ item }) => {
    const status = item.status || 'Pending';
    const amount = Number(item.amount ?? 0);
    const date = item.date || item.createdAt;
    const lookupName = (id) => {
      if (!id) return null;
      if (user?.id && Number(user.id) === Number(id) && user?.fullName) return user.fullName;
      const m = members.find((x) => Number(x.id) === Number(id));
      return m?.name || null;
    };
    const payerName = item.payerName && item.payerName !== 'Bilinmeyen' ? item.payerName : (lookupName(item.payerId) || '');
    const toName = item.toName && item.toName !== 'Bilinmeyen' ? item.toName : (lookupName(item.toId) || '');
    const note = item.note || '';
    const paymentMethod = item.paymentMethod || 'Cash';
    const trMethod = (() => {
      const t = String(paymentMethod).toLowerCase();
      if (/(cash|nakit)/.test(t)) return 'Nakit';
      if (/(bank|transfer|havale|eft)/.test(t)) return 'Havale/EFT';
      if (/(card|kredi|debit)/.test(t)) return 'Kart';
      return 'Ödeme';
    })();

    const color =
      status === 'Approved' ? (theme.colors.success?.[600]) :
      status === 'Rejected' ? (theme.colors.error?.[600]) :
      (theme.colors.warning?.[600]);

    const statusText = 
      status === 'Approved' ? 'Onaylandı' :
      status === 'Rejected' ? 'Reddedildi' :
      'Bekliyor';

    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <Text style={styles.title}>{(payerName || 'İsim yok')} ➜ {(toName || 'İsim yok')}</Text>
        <Text style={styles.sub}>{date ? new Date(date).toLocaleString('tr-TR') : '-'}</Text>
        {note ? <Text style={styles.note}>📝 {note}</Text> : null}
        <Text style={styles.sub}>💳 {trMethod}</Text>
        <Text style={[styles.amount, { color }]}>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} • {statusText}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(x, i) => String(x.id ?? x.paymentId ?? i)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 12 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={[styles.header, { color: theme.colors.text.primary }]}>Ödemeler</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const hid = route?.params?.houseId || user?.defaultHouseId;
                if (hid) {
                  navigation.navigate('OdemeEkle', { houseId: hid, houseName: 'Ev' });
                } else {
                  navigation.navigate('GrupListesi', { redirectTo: 'OdemeEkle' });
                }
              }}
            >
              <Text style={[styles.link, { color: theme.colors.primary?.[600] }]}>+ Ödeme Ekle</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: theme.colors.neutral?.[200] }, filterMode === 'all' && { backgroundColor: theme.colors.primary?.[600] }]}
              onPress={() => setFilterMode('all')}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, { color: theme.colors.text.primary }, filterMode === 'all' && { color: theme.colors.text?.onPrimary }]}>Tümü</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: theme.colors.neutral?.[200] }, filterMode === 'mine' && { backgroundColor: theme.colors.primary?.[600] }]}
              onPress={() => setFilterMode('mine')}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, { color: theme.colors.text.primary }, filterMode === 'mine' && { color: theme.colors.text?.onPrimary }]}>Benim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: theme.colors.neutral?.[200] }, filterMode === 'incoming' && { backgroundColor: theme.colors.primary?.[600] }]}
              onPress={() => setFilterMode('incoming')}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, { color: theme.colors.text.primary }, filterMode === 'incoming' && { color: theme.colors.text?.onPrimary }]}>Bana</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: theme.colors.neutral?.[200] }, filterMode === 'member' && { backgroundColor: theme.colors.primary?.[600] }]}
              onPress={() => setFilterMode('member')}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, { color: theme.colors.text.primary }, filterMode === 'member' && { color: theme.colors.text?.onPrimary }]}>Üye Seç</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: theme.colors.text.secondary }]}>Kayıt yok</Text> : null}
      />
      {filterMode === 'member' && (
        <View style={styles.memberPicker}>
          <Text style={[styles.memberPickerLabel, { color: theme.colors.text.secondary }]}>Üye:</Text>
          <View style={styles.memberChips}>
            {members.map(m => (
              <TouchableOpacity
                key={String(m.id)}
                style={[styles.chip, { backgroundColor: theme.colors.neutral?.[200] }, Number(selectedMemberId) === Number(m.id) && { backgroundColor: theme.colors.primary?.[600] }]}
                onPress={() => setSelectedMemberId(m.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, { color: theme.colors.text.primary, fontWeight: '700' }, Number(selectedMemberId) === Number(m.id) && { color: theme.colors.text?.onPrimary }]}> 
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerRow: { paddingHorizontal: 12, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: '900', color: theme.colors.text.primary },
  link: { color: theme.colors.primary?.[600], fontWeight: '800' },
  card: { borderLeftWidth: 4, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, marginBottom: 10, borderColor: theme.colors.neutral?.[200], borderWidth: 1 },
  title: { fontWeight: '900', color: theme.colors.text.primary },
  sub: { color: theme.colors.text.secondary, marginTop: 2 },
  note: { color: theme.colors.text.primary, marginTop: 6 },
  amount: { fontWeight: '900', marginTop: 6 },
  empty: { textAlign: 'center', color: theme.colors.text.secondary, padding: 24 },
  filterBar: { flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 12, paddingBottom: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.colors.neutral?.[200] },
  filterBtnActive: { backgroundColor: theme.colors.primary?.[600] },
  filterText: { color: theme.colors.text.primary, fontWeight: '700' },
  filterTextActive: { color: theme.colors.text?.onPrimary },
  memberPicker: { paddingHorizontal: 12, paddingBottom: 12 },
  memberPickerLabel: { color: theme.colors.text.secondary, marginBottom: 8 },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: theme.colors.neutral?.[200], borderRadius: 16 },
  chipActive: { backgroundColor: theme.colors.primary?.[600] },
  chipText: { color: theme.colors.text.primary, fontWeight: '700' },
  chipTextActive: { color: theme.colors.text?.onPrimary },
});

export default PaymentsScreen;
