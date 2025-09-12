// src/screens/BillsOverviewScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { expensesApi } from "../services/api";
import { Colors } from "../constants/Colors";
import { CommonStyles, ColorThemes } from "../shared/ui/CommonStyles";
import Toast from "../components/Toast";
import eventBus from "../shared/events/bus";
import { normalizeExpense, ymOf } from "../utils/expenseClassifier";
import { useFocusEffect } from '@react-navigation/native';
import useScrollRestore from '../hooks/useScrollRestore';

const formatAmount = (n) => `${Number(n || 0).toFixed(2)} ₺`;

const UTILITY_META = {
  Electricity: { label: "Elektrik", icon: "⚡" },
  Water: { label: "Su", icon: "💧" },
  Gas: { label: "Doğalgaz", icon: "🔥" },
  Internet: { label: "İnternet", icon: "🌐" },
  Rent: { label: "Kira", icon: "🏠" },
  Other: { label: "Diğer", icon: "📄" },
};

function toUtilityKey(k) {
  return UTILITY_META[k] ? k : "Other";
}

export default function BillsOverviewScreen({ navigation, route }) {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [items, setItems] = useState([]);
  const lastFetchedAtRef = useRef(0);
  const debounceRef = useRef(null);
  const { listRef, handleScroll } = useScrollRestore(`BillsOverviewScreen:${houseId ?? 'all'}`);

  // filters
  const [category, setCategory] = useState(null);
  const [paidFilter, setPaidFilter] = useState("all"); // all | paid | unpaid

  const showToast = (message, type = "success") =>
    setToast({ visible: true, message, type });
  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  const fetchData = async (opts = { silent: false }) => {
    if (!houseId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const res = await expensesApi.getByHouse(Number(houseId));
      const raw = res?.data?.data || res?.data || [];
      const arr = Array.isArray(raw) ? raw : [];
      const normalized = arr
        .map(normalizeExpense)
        .filter((x) => x.kind === "bill")
        .sort((a, b) => {
          const ad = new Date(a.date || 0).getTime();
          const bd = new Date(b.date || 0).getTime();
          return bd - ad; // yeni → eski
        });
      setItems(normalized);
      lastFetchedAtRef.current = Date.now();
    } catch (e) {
      console.error("BillsOverviewScreen fetch error:", e);
      showToast("Fatura verileri yüklenemedi", "error");
      setItems([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ silent: false });
  }, [houseId]);

  useEffect(() => {
    const h = ({ houseId: changedId }) => {
      if (Number(changedId) === Number(houseId)) fetchData({ silent: true });
    };
    eventBus.on("expenses:updated", h);
    return () => eventBus.off("expenses:updated", h);
  }, [houseId]);

  useFocusEffect(
    React.useCallback(() => {
      // Odaklanınca: kısa sürede geri dönüldüyse hemen refetch etme.
      const elapsed = Date.now() - (lastFetchedAtRef.current || 0);
      if (elapsed < 2 * 60 * 1000) {
        return; // 2 dk içinde geri dönüldü: mevcut listeyi göster, sesiz kal
      }
      // Debounce ile sessiz (spinner yok) refetch
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchData({ silent: true });
      }, 400);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [houseId])
  );

  // filtrelenmiş liste
  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (category && toUtilityKey(b.key) !== category) return false;
      if (paidFilter !== "all") {
        const paid =
          typeof b.isPaid === "boolean"
            ? b.isPaid
            : String(b.status || "").toLowerCase() === "paid";
        if (paidFilter === "paid" && !paid) return false;
        if (paidFilter === "unpaid" && paid) return false;
      }
      return true;
    });
  }, [items, category, paidFilter]);

  const totals = useMemo(() => {
    const all = filtered.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    return { all };
  }, [filtered]);

  const clearFilters = () => {
    setCategory(null);
    setPaidFilter("all");
  };

  const handleAddBill = () => {
    navigation.navigate("AddBillScreen", { houseId, houseName });
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={{ marginTop: 8 }}>Fatura verileri yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content} showsVerticalScrollIndicator={false} ref={listRef} onScroll={handleScroll} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={CommonStyles.title}>Faturalar</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddBill}>
            <Text style={styles.addBtnText}>+ Yeni Fatura</Text>
          </TouchableOpacity>
        </View>
        <Text style={CommonStyles.subtitle}>{houseName}</Text>

        {/* Totals */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Toplam Fatura</Text>
            <Text style={styles.summaryAmount}>{formatAmount(totals.all)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Fatura Sayısı</Text>
            <Text style={styles.summaryAmount}>{filtered.length}</Text>
          </View>
        </View>

        {/* Kategori filtreleri kaldırıldı (sade görünüm) */}

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>Bu dönemde fatura bulunmuyor.</Text>
            <TouchableOpacity onPress={handleAddBill} style={styles.resetBtn}>
              <Text style={{ fontSize: 12, fontWeight: "600" }}>+ Yeni Fatura Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={CommonStyles.card}>
            {filtered
              .slice()
              .sort((a, b) => {
                const ad = new Date(a.date || 0).getTime();
                const bd = new Date(b.date || 0).getTime();
                return bd - ad; // yeni → eski
              })
              .map((b, idx) => {
                const key = toUtilityKey(b.key);
                return (
                  <View key={String(b.id ?? idx)} style={CommonStyles.listItem}>
                    <View style={styles.iconCircle}><Text style={{ fontSize: 22 }}>{UTILITY_META[key].icon}</Text></View>
                    <View style={CommonStyles.listItemContent}>
                      <Text style={CommonStyles.listItemTitle}>{UTILITY_META[key].label}</Text>
                      <Text style={CommonStyles.listItemSubtitle}>
                        Tarih: {new Date(b.date || b._raw?.postDate || b._raw?.createdAt || Date.now()).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700' }}>{formatAmount(b.amount)}</Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: Colors.text.primary },
  subtitle: { fontSize: 13, color: Colors.text.secondary, marginLeft: 12, marginBottom: 6 },
  addBtn: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: Colors.text.secondary },
  summaryAmount: { fontSize: 16, fontWeight: "700", color: Colors.text.primary },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: Colors.primary[500],
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  empty: {
    alignItems: "center",
    marginTop: 40,
    padding: 16,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.text.secondary, marginBottom: 8 },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
  },
});
