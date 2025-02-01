import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const HarcamaEkleScreen = ({ navigation, route }) => {
  const { houseId } = route.params || {};
  const { user } = useAuth();

  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!houseId) {
      Alert.alert("Hata", "Ev ID bulunamadı.");
      navigation.goBack();
      return;
    }

    const fetchHouseMembers = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/House/Friends/${houseId}`);
        setMembers(response.data || []);
        if ((response.data || []).length === 0) {
          Alert.alert("Bilgi", "Bu evde henüz üye bulunmamaktadır.");
        }
      } catch (error) {
        console.error("Ev üyeleri yüklenirken hata:", error.response?.data || error.message);
        Alert.alert("Hata", "Ev üyeleri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchHouseMembers();
  }, [houseId]);

  const handleAddExpense = async () => {
    if (!user || !user.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi yüklenemedi. Lütfen tekrar giriş yapın.");
      return;
    }

    if (!expenseType || !amount || !payerId) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/Expenses/AddExpense", {
        Tur: expenseType,
        Tutar: parseFloat(amount),
        HouseId: houseId,
        OdeyenUserId: payerId,
        KaydedenUserId: user.id,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Başarılı", "Harcama başarıyla eklendi.");
        navigation.goBack();
      } else {
        console.error("API Yanıt Hatası:", response);
        Alert.alert("Hata", "Harcama eklenirken bir sorun oluştu.");
      }
    } catch (error) {
      console.error("Harcama eklenirken hata:", error.response?.data || error.message);
      Alert.alert("Hata", "Harcama eklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  const memberItems = members.length > 0
    ? members.map((member, index) => ({
        label: member.fullName,
        value: member.userId,
        key: `${member.userId}-${index}`,
      }))
    : [{ label: "Üye bulunamadı", value: null }];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Harcama Ekle</Text>

      <Text style={styles.label}>Harcama Türü</Text>
      <RNPickerSelect
        onValueChange={setExpenseType}
        value={expenseType}
        items={[
          { label: "Market", value: "Market" },
          { label: "Fatura", value: "Fatura" },
          { label: "Kira", value: "Kira" },
          { label: "Diğer", value: "Diğer" },
        ]}
        placeholder={{ label: "Bir harcama türü seçin", value: "" }}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>Harcama Tutarı</Text>
      <TextInput
        style={styles.input}
        placeholder="Harcama tutarını girin"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Ödemeyi Yapan</Text>
      <RNPickerSelect
        onValueChange={setPayerId}
        value={payerId}
        items={memberItems}
        placeholder={{ label: "Üyelerden birini seçin", value: null }}
        style={pickerSelectStyles}
      />

      <TouchableOpacity style={styles.button} onPress={handleAddExpense}>
        <Text style={styles.buttonText}>Ekle</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f8f8" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: { backgroundColor: "#28a745", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

const pickerSelectStyles = {
  inputAndroid: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, backgroundColor: "#fff", marginBottom: 16 },
  inputIOS: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, backgroundColor: "#fff", marginBottom: 16 },
};

export default HarcamaEkleScreen;
