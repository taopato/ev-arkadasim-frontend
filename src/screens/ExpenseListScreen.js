// src/screens/ExpensesListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { expensesApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../constants/Colors';
import eventBus from '../shared/events/bus';
import Toast from '../components/Toast';
import { NON_BILL_KEYS, normalizeExpense } from '../utils/expenseClassifier';

const formatAmount = (n) => `${Number(n || 0).toFixed(2)} ₺`;
const iconOf = (key) => ({ Market: '🛒', Food: '🍔', Other: '📦' }[key] || '📄');
const trTitle = (key) => ({ Market: 'Market', Food: 'Yemek', Other: 'Diğer' }[key] || key);

const ExpensesListScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [items, setItems] = useState([]);

  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });
  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  const fetchData = async () => {
    if (!houseId) return;
    setLoading(true);
    try {
      const res = await expensesApi.getByHouse(Number(houseId));
      const raw = res?.data?.data || res?.data || [];
      const arr = Array.isArray(raw) ? raw : [];
      const normalized = arr.map(normalizeExpense);

      const filtered = normalized
        .filter((x) => x.kind === 'other') // sadece Market/Yemek/Diğer
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // en yeni en üstte

      setItems(filtered);
    } catch (e) {
      console.error('ExpensesListScreen fetch error:', e);
      showToast('Harcamalar yüklenemedi', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [houseId]);

  // anında yenile
  useEffect(() => {
    const h = ({ houseId: changedId }) => {
      if (Number(changedId) === Number(houseId)) fetchData();
    };
    eventBus.on('expenses:updated', h);
    return () => eventBus.off('expenses:updated', h);
  }, [houseId]);

  const handleAdd = () => {
    navigation.navigate('AddExpenseScreen', { houseId, houseName });
  };

  if (loading) {
    return (
      <View style={CommonStyles.container}>
        <View style={CommonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={CommonStyles.loadingText}>Harcamalar yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Listesi</Text>
          <Text style={CommonStyles.subtitle}>{houseName} • {items.length} harcama</Text>
        </View>

        {/* Yeni Harcama */}
        <TouchableOpacity style={CommonStyles.menuButton} onPress={handleAdd} activeOpacity={0.8}>
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>➕</Text>
            <Text style={CommonStyles.buttonText}>Yeni Harcama Ekle</Text>
            <Text style={CommonStyles.buttonSubtext}>Yeni harcama kaydı oluşturun</Text>
          </View>
        </TouchableOpacity>

        {items.length > 0 ? (
          <View style={CommonStyles.card}>
            {items.map((it, idx) => (
              <View key={String(it.id ?? idx)} style={CommonStyles.listItem}>
                <View style={styles.iconCircle}><Text style={{ fontSize: 22 }}>{iconOf(it.key)}</Text></View>
                <View style={CommonStyles.listItemContent}>
                  <Text style={CommonStyles.listItemTitle}>{it.title}</Text>
                  <Text style={CommonStyles.listItemSubtitle}>
                    Ödeyen: {it.payerName || '—'} • Tarih: {new Date(it.date).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>{formatAmount(it.amount)}</Text>
                  <Text style={{ fontSize: 12, color: Colors.text.secondary }}>{trTitle(it.key)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={CommonStyles.emptyContainer}>
            <Text style={CommonStyles.emptyIcon}>🧾</Text>
            <Text style={CommonStyles.emptyText}>Liste boş. Market/Yemek/Diğer türü bir harcama ekleyin.</Text>
          </View>
        )}

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
});

export default ExpensesListScreen;
