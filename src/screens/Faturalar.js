// Planlı Giderler — yalnızca içinde bulunulan ayın, bugün/öncesi kayıtları.
// Plan parent (başlık) her durumda gizlenir. Her plan için ayda en fazla 1 çocuk gösterilir.
// Sıralama: tarih DESC, eşitlikte id DESC.

import React, { useEffect, useMemo, useRef } from "react";
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
import { CommonStyles } from "../shared/ui/CommonStyles";
import Toast from "../components/Toast";
import eventBus from "../shared/events/bus";
import { normalizeExpense, NON_BILL_KEYS } from "../utils/expenseClassifier";
import { useFocusEffect } from "@react-navigation/native";
import useScrollRestore from "../hooks/useScrollRestore";

// Para formatlaması - Türk Lirası standardı
const formatAmount = (amount) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const UTILITY_META = {
  Electricity: { label: "Elektrik", icon: "⚡" },
  Water: { label: "Su", icon: "💧" },
  Gas: { label: "Doğalgaz", icon: "🔥" },
  Internet: { label: "İnternet", icon: "🌐" },
  Rent: { label: "Kira", icon: "🏠" },
  Other: { label: "Diğer", icon: "📄" },
};

// Günlük harcama anahtarları utils/expenseClassifier içindeki NON_BILL_KEYS'te.
// Fatura sayılanlar = NON_BILL_KEYS dışında kalanlar
const isUtilityKey = (k) => !NON_BILL_KEYS.includes(k);

function toUtilityKey(k) {
  return UTILITY_META[k] ? k : "Other";
}

// UTC bazlı: içinde bulunulan ay [start, end)
const getMonthWindow = (base = new Date()) => {
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return { start, end };
};

// normalizeExpense → tek kaynaktan oku, yoksa güvenli fallback
const getItemDate = (it) => {
  const v =
    it?.date ||
    it?._raw?.kayitTarihi ||
    it?._raw?.postDate ||
    it?._raw?.createdDate ||
    it?.kayitTarihi ||
    it?.postDate ||
    it?.createdDate;
  return new Date(v || 0);
};

// “tarih DESC, eşitlikte id DESC”
const cmpByDateThenIdDesc = (a, b) => {
  const db = getItemDate(b).getTime();
  const da = getItemDate(a).getTime();
  if (db !== da) return db - da;
  const ib = Number(b.id || b._raw?.id || 0);
  const ia = Number(a.id || a._raw?.id || 0);
  return ib - ia;
};

export default function BillsOverviewScreen({ navigation, route }) {
  const { houseId, houseName } = route.params || {};
  const detailRouteName = route?.params?.detailScreenName || "HarcamaDetayi";
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [items, setItems] = React.useState([]);
  const lastFetchedAtRef = useRef(0);
  const debounceRef = useRef(null);
  const { listRef, handleScroll } = useScrollRestore(
    `BillsOverviewScreen:${houseId ?? "all"}`
  );

  // (isteğe bağlı) basit filtre state'leri
  const [category, setCategory] = React.useState(null);
  const [paidFilter, setPaidFilter] = React.useState("all"); // all | paid | unpaid

  const showToast = (message, type = "success") =>
    setToast({ visible: true, message, type });
  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  const fetchData = async (opts = { silent: false }) => {
    if (!houseId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const resExp = await expensesApi.getByHouse(Number(houseId));
      const rawExp =
        resExp?.data?.data ??
        resExp?.data?.list ??
        resExp?.data ??
        [];
      const arrExp = Array.isArray(rawExp) ? rawExp : [];

      // normalize
      const normalized = arrExp.map(normalizeExpense);

      const now = new Date();
      const { start: monthStart, end: monthEnd } = getMonthWindow(now);

      const candidates = normalized.filter((x) => {
        const raw = x._raw || {};
        const parentId =
          raw.parentExpenseId ?? raw.ParentExpenseId ?? null;

        // plan sinyal/çocuk tespiti
        const isChild = parentId != null;
        const installmentCount =
          Number(raw.installmentCount ?? raw.InstallmentCount ?? 0);
        const hasPlanSignals =
          installmentCount > 1 ||
          (raw.dueDay ?? raw.DueDay ?? null) != null ||
          (raw.planStartMonth ??
            raw.PlanStartMonth ??
            raw.startMonth ??
            raw.StartMonth ??
            null) != null;

        // Yalnız planlı kayıtlar (child veya plan sinyali taşıyanlar)
        if (!(isChild || hasPlanSignals)) return false;

        // Plan parent'ı hiçbir zaman gösterme
        if (!isChild && hasPlanSignals) return false;

        // Yalnız fatura kategorileri (günlük harcamaları dışla)
        if (!isUtilityKey(x.key)) return false;

        // Ay penceresi + olgunlaşma
        const d = getItemDate(x);
        if (!(d >= monthStart && d < monthEnd)) return false; // sadece bu ay
        if (d > now) return false; // bugün/öncesi

        return true;
      });

      // parentId+YYYY-MM temelinde dedupe (ayda tek çocuk)
      const pickMap = new Map();
      for (const it of candidates) {
        const raw = it._raw || {};
        const parentId =
          raw.parentExpenseId ?? raw.ParentExpenseId ?? null;
        const d = getItemDate(it);
        const ym = `${d.getUTCFullYear()}-${String(
          d.getUTCMonth() + 1
        ).padStart(2, "0")}`;

        const key =
          parentId != null
            ? `p-${parentId}-${ym}`
            : `s-${it.id || raw.id || `${it.title}-${ym}`}`;

        const prev = pickMap.get(key);
        if (!prev) {
          pickMap.set(key, it);
        } else {
          const better = cmpByDateThenIdDesc(it, prev) < 0 ? prev : it;
          pickMap.set(key, better);
        }
      }

      const onlyThisMonth = Array.from(pickMap.values()).sort(
        cmpByDateThenIdDesc
      );

      setItems(onlyThisMonth);
      lastFetchedAtRef.current = Date.now();
    } catch (e) {
      console.error("BillsOverviewScreen fetch error:", e);
      showToast("Planlı gider verileri yüklenemedi", "error");
      setItems([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ silent: false });
  }, [houseId]);

  useEffect(() => {
    const onUpdated = ({ houseId: changedId }) => {
      if (Number(changedId) === Number(houseId)) fetchData({ silent: true });
    };
    const onCreatedRecurring = ({ houseId: changedId }) => {
      if (Number(changedId) !== Number(houseId)) return;
      fetchData({ silent: true });
    };
    eventBus.on("expenses:updated", onUpdated);
    eventBus.on("expenses:created:recurring", onCreatedRecurring);
    return () => {
      eventBus.off("expenses:updated", onUpdated);
      eventBus.off("expenses:created:recurring", onCreatedRecurring);
    };
  }, [houseId]);

  useFocusEffect(
    React.useCallback(() => {
      const elapsed = Date.now() - (lastFetchedAtRef.current || 0);
      if (elapsed < 2 * 60 * 1000) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => fetchData({ silent: true }),
        400
      );
      return () =>
        debounceRef.current && clearTimeout(debounceRef.current);
    }, [houseId])
  );

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
    const all = filtered.reduce(
      (s, b) => s + (Number(b.amount) || 0),
      0
    );
    return { all };
  }, [filtered]);

  const handleAddBill = () => {
    navigation.navigate("NewRecurringChargeScreen", {
      houseId,
      houseName,
      defaultMode: "recurring",
    });
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
      <ScrollView
        style={CommonStyles.content}
        showsVerticalScrollIndicator={false}
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={CommonStyles.title}>Planlı Giderler</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddBill}>
            <Text style={styles.addBtnText}>+ Düzenli Gider Ekle</Text>
          </TouchableOpacity>
        </View>
        <Text style={CommonStyles.subtitle}>{houseName}</Text>

        {/* Totals */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Toplam Fatura</Text>
            <Text style={styles.summaryAmount}>
              {formatAmount(totals.all)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Fatura Sayısı</Text>
            <Text style={styles.summaryAmount}>{filtered.length}</Text>
          </View>
        </View>

        {/* Liste */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>
              {loading
                ? "Veriler yükleniyor..."
                : "Bu ay için görünür planlı gider bulunmuyor."}
            </Text>
            {!loading && (
              <TouchableOpacity
                onPress={handleAddBill}
                style={styles.resetBtn}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  + Düzenli Gider Ekle
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((it, idx) => {
              const keyK = toUtilityKey(it.key);
              const d = getItemDate(it);
              const meta = UTILITY_META[keyK] || UTILITY_META.Other;
              const titleSuffix = (() => {
                const raw = it._raw || {};
                const idxNo =
                  raw.installmentIndex || raw.InstallmentIndex || null;
                const cnt =
                  raw.installmentCount || raw.InstallmentCount || null;
                return idxNo != null && cnt != null
                  ? ` • Taksit ${idxNo}/${cnt}`
                  : "";
              })();

              return (
                <TouchableOpacity
                  key={String(it.id ?? idx)}
                  style={CommonStyles.listItem}
                  onPress={() => {
                    navigation.navigate(detailRouteName, {
                      expenseId: it.id,
                      houseId,
                      houseName,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>
                      {meta.label}
                      {titleSuffix}
                    </Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      Tarih: {d.toLocaleDateString("tr-TR")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700" }}>
                      {formatAmount(it.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
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
  summaryLabel: {
    fontSize: 12,
    color: Colors.text?.secondary || "#666",
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text?.primary || "#111",
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
  emptyText: {
    fontSize: 14,
    color: Colors.text?.secondary || "#666",
    marginBottom: 8,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
  },
});
