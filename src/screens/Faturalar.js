// src/screens/BillsOverviewScreen.js
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
import { getCategoryDisplayName as getCatName, getCategoryIcon as getCatIcon } from "../constants/ExpenseEnums";
import { CommonStyles } from "../shared/ui/CommonStyles";
import Toast from "../components/Toast";
import eventBus from "../shared/events/bus";
import {
  normalizeExpense,
  NON_BILL_KEYS,
  CATEGORY_ID_TO_KEY,
} from "../utils/expenseClassifier";
import { getParentCategoryHint } from "../shared/state/categoryHints";
import { useFocusEffect } from "@react-navigation/native";
import useScrollRestore from "../hooks/useScrollRestore";

// ₺ format
const formatAmount = (amount) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const UTILITY_META = {
  Electricity: { label: "Elektrik", icon: "⚡" },
  Water: { label: "Su", icon: "💧" },
  Gas: { label: "Doğalgaz", icon: "🔥" },
  Internet: { label: "İnternet", icon: "🌐" },
  Rent: { label: "Kira", icon: "🏠" },
  Other: { label: "Diğer", icon: "📄" },
};

// Günlük harcama anahtarları utils/expenseClassifier içindeki NON_BILL_KEYS’te.
// Fatura sayılanlar = NON_BILL_KEYS dışında kalanlar
const isUtilityKey = (k) => !NON_BILL_KEYS.includes(k);
const toUtilityKey = (k) => (UTILITY_META[k] ? k : "Other");

// Türkçe/aksan temizleme (fallback tahmin için)
const normalizeText = (s = "") => {
  try {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u");
  } catch {
    return String(s).toLowerCase();
  }
};

// Kategoriyi güvenle seç: explicit field -> tahmin -> Other
const pickUtilityKey = (it) => {
  const raw = it?._raw || {};

  // Aday explicit değerler (sırasıyla)
  const candidates = [
    it?.key,
    raw.category,
    raw.Category,
    raw.categoryId,
    raw.CategoryId,
    raw.utilityType,
    raw.UtilityType,
  ];

  // 1) Sayısal kategori → enum map
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const n = Number(c);
    if (Number.isFinite(n) && CATEGORY_ID_TO_KEY[n]) {
      return CATEGORY_ID_TO_KEY[n];
    }
  }

  // 2) Metin olarak gelen anahtarlar (case-insensitive eşleşme)
  for (const c of candidates) {
    if (!c || typeof c !== "string") continue;
    const lower = c.toLowerCase();
    const match = Object.keys(UTILITY_META).find(
      (k) => k.toLowerCase() === lower
    );
    if (match) return match;
  }

  // 3) explicit yoksa Tur metninden tahmin et (kök + _raw + title)
  const t = normalizeText(it?.tur || it?.Tur || raw.tur || raw.Tur || it?.title || "");
  if (/elektrik|electric|electricity/.test(t)) return "Electricity";
  if (/(^|\s)(su|water)($|\s)/.test(t)) return "Water";
  if (/(dogalgaz|doğalgaz|gaz|gas|naturalgas)/.test(t)) return "Gas";
  if (/internet/.test(t)) return "Internet";
  if (/(kira|rent)/.test(t)) return "Rent";

  return "Other";
};

// UTC bazlı: bu ay [start, end)
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

  // (opsiyonel) üst filtre state’leri
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
        resExp?.data?.data ?? resExp?.data?.list ?? resExp?.data ?? [];
      const arrExp = Array.isArray(rawExp) ? rawExp : [];

      const normalized = arrExp.map(normalizeExpense);

      // BE alanlarından (categoryId/category/utilityType) kesin anahtar çıkar; yoksa parent'tan devral
      const getKeyFromRaw = (r = {}) => {
        // sayısal id → enum
        const idCand = r.categoryId ?? r.CategoryId ?? (typeof r.category === 'number' ? r.category : undefined) ?? (typeof r.Category === 'number' ? r.Category : undefined);
        if (idCand != null && CATEGORY_ID_TO_KEY[Number(idCand)]) return CATEGORY_ID_TO_KEY[Number(idCand)];
        // metin anahtar
        const nameCand = (typeof r.category === 'string' && r.category) || (typeof r.Category === 'string' && r.Category) || (typeof r.utilityType === 'string' && r.utilityType) || (typeof r.UtilityType === 'string' && r.UtilityType) || '';
        if (nameCand) {
          const lower = String(nameCand).toLowerCase();
          const direct = Object.keys(UTILITY_META).find(k => k.toLowerCase() === lower);
          if (direct) return direct;
          if (lower.includes('kira')) return 'Rent';
          if (lower.includes('elektrik') || lower.includes('electric') || lower.includes('electricity')) return 'Electricity';
          if (lower === 'su' || lower.includes(' water') || lower.includes('su ') || lower.includes('water')) return 'Water';
          if (lower.includes('doğalgaz') || lower.includes('dogalgaz') || lower.includes('naturalgas') || lower === 'gaz' || lower.includes(' gas')) return 'Gas';
          if (lower.includes('internet')) return 'Internet';
          if (lower.includes('diğer') || lower.includes('diger') || lower === 'other') return 'Other';
        }
        return undefined;
      };

      const idToKey = new Map();
      for (const r of arrExp) {
        const rid = Number(r?.id ?? r?.expenseId);
        if (!Number.isFinite(rid)) continue;
        const k = getKeyFromRaw(r);
        if (k && UTILITY_META[k]) idToKey.set(rid, k);
      }

      // Eksik kalan parent kategorilerini BE'den tamamla
      const missingParentIds = new Set();
      for (const x of normalized) {
        const raw = x._raw || {};
        const pid = raw.parentExpenseId ?? raw.ParentExpenseId;
        if (pid != null && !idToKey.has(Number(pid))) missingParentIds.add(Number(pid));
      }
      if (missingParentIds.size > 0) {
        const parentIdArr = Array.from(missingParentIds);
        await Promise.all(parentIdArr.map(async (pid) => {
          try {
            const res = await expensesApi.getById(pid);
            const pr = res?.data?.data ?? res?.data ?? {};
            const k = getKeyFromRaw(pr);
            if (k && UTILITY_META[k]) idToKey.set(Number(pid), k);
          } catch {}
        }));
      }

      const normalizedWithKeys = normalized.map(x => {
        let k = x.key;
        const raw = x._raw || {};
        if (!UTILITY_META[k]) {
          const fromRaw = getKeyFromRaw(raw);
          if (fromRaw) k = fromRaw;
          else {
            const pid = raw.parentExpenseId ?? raw.ParentExpenseId;
            if (pid != null) {
              if (idToKey.has(Number(pid))) k = idToKey.get(Number(pid));
              else {
                const hint = getParentCategoryHint(pid);
                if (hint && UTILITY_META[hint]) k = hint;
              }
            }
          }
        }
        return { ...x, key: k || 'Other' };
      });

      const now = new Date();
      const { start: monthStart, end: monthEnd } = getMonthWindow(now);

      const candidates = normalizedWithKeys.filter((x) => {
        const raw = x._raw || {};
        const parentId = raw.parentExpenseId ?? raw.ParentExpenseId ?? null;

        // plan sinyal/çocuk
        const isChild = parentId != null;
        const installmentCount = Number(
          raw.installmentCount ?? raw.InstallmentCount ?? 0
        );
        const hasPlanSignals =
          installmentCount > 1 ||
          (raw.dueDay ?? raw.DueDay ?? null) != null ||
          (raw.planStartMonth ??
            raw.PlanStartMonth ??
            raw.startMonth ??
            raw.StartMonth ??
            null) != null;

        // Utility değişken faturaları (Elektrik/Su/Doğalgaz) plan sinyali olmasa da göster
        const keyKForFilter = toUtilityKey(pickUtilityKey(x));
        const isVariableUtility = keyKForFilter === 'Water' || keyKForFilter === 'Electricity' || keyKForFilter === 'Gas';

        // Yalnız planlı kayıtlar (child veya plan sinyali taşıyanlar)
        if (!(isChild || hasPlanSignals || isVariableUtility)) return false;

        // Parent asla gösterilmez
        if (!isChild && hasPlanSignals) return false;

        // Child değilse (single), utility olmayanları çıkar
        if (!isChild && !isUtilityKey(keyKForFilter)) return false;

        // Bu ay ve bugün/öncesi
        const d = getItemDate(x);
        if (!(d >= monthStart && d < monthEnd)) return false;
        if (d > now) return false;

        return true;
      });

      // parentId+YYYY-MM bazında ‘ayda tek çocuk’
      const pickMap = new Map();
      for (const it of candidates) {
        const raw = it._raw || {};
        const parentId = raw.parentExpenseId ?? raw.ParentExpenseId ?? null;
        const d = getItemDate(it);
        const ym = `${d.getUTCFullYear()}-${String(
          d.getUTCMonth() + 1
        ).padStart(2, "0")}`;

        const key =
          parentId != null ? `p-${parentId}-${ym}` : `s-${it.id || raw.id || `${it.title}-${ym}`}`;

        const prev = pickMap.get(key);
        if (!prev) pickMap.set(key, it);
        else {
          const better = cmpByDateThenIdDesc(it, prev) < 0 ? it : prev;
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
      debounceRef.current = setTimeout(() => fetchData({ silent: true }), 400);
      return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [houseId])
  );

  // (opsiyonel) üst filtreler
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
      (s, b) => s + (Number(b.amount ?? b.tutar) || 0),
      0
    );
    return { all };
  }, [filtered]);

  const handleAddBill = () => {
    navigation.navigate("DuzenliGiderEkle", {
      houseId,
      houseName,
      defaultMode: "recurring",
    });
  };

  // Sağ üst header butonu: Planlı Gider Ekle
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleAddBill}
          style={{
            backgroundColor: Colors.primary[500],
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>+ Ekle</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, houseId, houseName]);

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
            <Text style={styles.summaryAmount}>{formatAmount(totals.all)}</Text>
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
              <TouchableOpacity onPress={handleAddBill} style={styles.resetBtn}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>
                  + Düzenli Gider Ekle
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((it, idx) => {
              // Kategoriyi explicit alanlardan oku; yoksa tahmin et
              const raw = it._raw || {};
              const keyK = toUtilityKey(pickUtilityKey(it));
              const d = getItemDate(it);
              // BE’deki id/string kategoriye göre label & ikon – FaturaOlustur.js ile aynı mantık
              const catRaw = raw.category ?? raw.Category ?? raw.categoryId ?? raw.CategoryId ?? keyK;
              const icon = getCatIcon(catRaw);
              const label = getCatName(catRaw);

              // Only "Other" + child ise taksit etiketi
              const idxNo =
                raw.installmentIndex || raw.InstallmentIndex || null;
              const cnt =
                raw.installmentCount || raw.InstallmentCount || null;
              const parentId =
                raw.parentExpenseId ?? raw.ParentExpenseId ?? null;
              const isChild = parentId != null;
              const titleSuffix =
                keyK === "Other" && isChild && idxNo != null && cnt != null
                  ? ` • Taksit ${idxNo}/${cnt}`
                  : "";

              return (
                <TouchableOpacity
                  key={String(it.id ?? idx)}
                  style={CommonStyles.listItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("BillDetail", {
                      billId: it.id,
                      houseId,
                      houseName,
                    })
                  }
                >
                  <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 22 }}>{icon}</Text>
                  </View>
                  <View style={CommonStyles.listItemContent}>
                    <Text style={CommonStyles.listItemTitle}>
                      {label}
                      {titleSuffix}
                    </Text>
                    <Text style={CommonStyles.listItemSubtitle}>
                      Tarih: {d.toLocaleDateString("tr-TR")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700" }}>
                      {formatAmount(it.amount ?? it.tutar)}
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
  summaryLabel: { fontSize: 12, color: Colors.text?.secondary || "#666" },
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
