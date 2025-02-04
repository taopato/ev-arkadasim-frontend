import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
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
      console.log('Ev ID bulunamadı');
      Alert.alert("Hata", "Ev ID bulunamadı.");
      navigation.goBack();
      return;
    }

    console.log('useEffect tetiklendi, houseId:', houseId);
    const fetchMembers = async () => {
      setLoading(true);
      try {
        // Önce ev üyelerini al
        console.log('Ev üyeleri getiriliyor. Ev ID:', houseId);
        const houseMembersResponse = await api.get(`/House/Friends/${houseId}`);
        console.log('Ev üyeleri yanıtı:', JSON.stringify(houseMembersResponse.data, null, 2));

        // Sonra tüm kullanıcıları al
        console.log('Tüm kullanıcılar getiriliyor...');
        const usersResponse = await api.get('/Users');
        console.log('Kullanıcılar yanıtı:', JSON.stringify(usersResponse.data, null, 2));

        if (houseMembersResponse.data && Array.isArray(houseMembersResponse.data)) {
          // İki listeyi email'e göre eşleştir
          const validMembers = houseMembersResponse.data.map(houseMember => {
            // Kullanıcılar listesinden eşleşen kullanıcıyı bul
            const matchingUser = usersResponse.data.find(
              user => user.email === houseMember.email
            );

            if (matchingUser) {
              return {
                id: matchingUser.id,
                fullName: houseMember.fullName,
                email: houseMember.email
              };
            }
            return null;
          }).filter(member => member !== null); // null olanları filtrele

          console.log('Eşleştirilmiş üye listesi:', validMembers);
          setMembers(validMembers);
          
          if (validMembers.length === 0) {
            console.log('Üye bulunamadı');
            Alert.alert(
              "Bilgi", 
              "Bu evde henüz üye bulunmamaktadır.",
              [{ text: "Tamam", onPress: () => navigation.goBack() }]
            );
          }
        } else {
          console.log('Ev üyeleri yanıtı array değil:', typeof houseMembersResponse.data);
          Alert.alert("Hata", "Ev üyeleri verisi beklenen formatta değil.");
        }
      } catch (error) {
        console.error("Üyeler yüklenirken hata:", error);
        Alert.alert(
          "Hata", 
          "Üyeler yüklenemedi. " + (error.response?.data?.message || error.message)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [houseId, navigation]);

  const handlePayerChange = (value) => {
    console.log('Seçilen ödeyici değeri:', value);
    if (!value) {
      console.log('Ödeyici seçimi temizlendi');
      setPayerId('');
      return;
    }

    const selectedMember = members.find(m => m.fullName === value);
    console.log('Bulunan üye:', selectedMember);
    if (selectedMember) {
      console.log('Ayarlanacak payerId:', selectedMember.id);
      setPayerId(selectedMember.id.toString());
    } else {
      console.log('Üye bulunamadı');
      setPayerId('');
    }
  };

  const handleAddExpense = async () => {
    console.log('Harcama ekleme başlatıldı:', {
      expenseType,
      amount,
      payerId,
      houseId,
      userId: user?.id
    });

    if (!expenseType || !amount || !payerId) {
      console.log('Eksik alanlar:', { expenseType, amount, payerId });
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log('Geçersiz tutar:', amount);
      Alert.alert("Hata", "Geçerli bir tutar giriniz.");
      return;
    }

    setLoading(true);

    try {
      const expenseData = {
        tur: expenseType.trim(),
        tutar: numericAmount,
        houseId: Number(houseId),
        odeyenUserId: Number(payerId),
        kaydedenUserId: Number(user.id)
      };

      console.log('API\'ye gönderilecek veri:', expenseData);

      const response = await api.post('/Expenses/AddExpense', expenseData);
      
      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Başarılı", 
          "Harcama başarıyla eklendi.",
          [{ text: "Tamam", onPress: () => navigation.goBack() }]
        );
      } else {
        console.error('API yanıtı başarısız:', response);
        throw new Error("Beklenmeyen API yanıtı: " + response.status);
      }
    } catch (error) {
      console.error('Harcama ekleme hatası:', error);
      Alert.alert(
        "Hata",
        error.response?.data?.message || "Harcama eklenirken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  const expenseTypes = [
    { label: "Market", value: "Market" },
    { label: "Fatura", value: "Fatura" },
    { label: "Kira", value: "Kira" },
    { label: "Manav", value: "Manav" },
    { label: "Diğer", value: "Diğer" }
  ];

  const selectStyle = {
    width: '100%',
    height: 45,
    padding: '8px 12px',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Harcama Ekle</Text>

      <Text style={styles.label}>Harcama Türü</Text>
      {Platform.OS === 'web' ? (
        <select
          style={selectStyle}
          value={expenseType}
          onChange={(e) => setExpenseType(e.target.value)}
        >
          <option key="expense-type-default" value="">Bir harcama türü seçin</option>
          {expenseTypes.map((type) => (
            <option key={`expense-type-${type.value}`} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      ) : (
        <RNPickerSelect
          onValueChange={(value) => setExpenseType(value || '')}
          value={expenseType}
          items={expenseTypes}
          placeholder={{ label: "Bir harcama türü seçin", value: null }}
          style={pickerSelectStyles}
        />
      )}

      <Text style={styles.label}>Harcama Tutarı</Text>
      <TextInput
        style={styles.input}
        placeholder="Harcama tutarını girin"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Ödemeyi Yapan</Text>
      {Platform.OS === 'web' ? (
        <View style={styles.selectContainer}>
          <select
            style={selectStyle}
            value={payerId ? members.find(m => m.id.toString() === payerId)?.fullName || "" : ""}
            onChange={(e) => handlePayerChange(e.target.value)}
          >
            <option key="default-option" value="">Üyelerden birini seçin</option>
            {members.map((member) => (
              <option 
                key={member.id} 
                value={member.fullName}
              >
                {member.fullName} (ID: {member.id})
              </option>
            ))}
          </select>
        </View>
      ) : (
        <RNPickerSelect
          onValueChange={(value) => {
            const selectedMember = members.find(m => m.fullName === value);
            if (selectedMember) {
              setPayerId(selectedMember.id.toString());
            }
          }}
          value={payerId ? members.find(m => m.id.toString() === payerId)?.fullName : null}
          items={members.map(member => ({
            label: `${member.fullName} (ID: ${member.id})`,
            value: member.fullName,
            key: String(member.id)
          }))}
          placeholder={{ 
            label: "Üyelerden birini seçin", 
            value: null,
            key: "default-option"
          }}
          style={pickerSelectStyles}
        />
      )}

      <Text style={styles.kaydedenUserInfo}>
        Kaydeden: {user?.fullName || 'Bilinmeyen Kullanıcı'} (ID: {user?.id || 'N/A'})
      </Text>

      <TouchableOpacity 
        style={[
          styles.button, 
          (!expenseType || !amount || !payerId) ? styles.buttonDisabled : null,
          loading ? styles.buttonLoading : null
        ]}
        onPress={handleAddExpense}
        disabled={!expenseType || !amount || !payerId || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Ekleniyor..." : "Ekle"}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: "#f8f8f8" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 16 
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff"
  },
  button: { 
    backgroundColor: "#28a745", 
    padding: 16, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 16 
  },
  buttonDisabled: {
    backgroundColor: "#cccccc"
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
  },
  buttonLoading: {
    opacity: 0.7
  },
  kaydedenUserInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 10
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
    } : {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    })
  },
  selectContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16
  },
  selectStyle: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
    fontSize: 16,
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1000,
    appearance: 'menulist',
    WebkitAppearance: 'menulist'
  }
});

const pickerSelectStyles = {
  inputAndroid: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: "#fff", 
    marginBottom: 16,
    color: '#000'
  },
  inputIOS: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: "#fff", 
    marginBottom: 16,
    color: '#000'
  },
};

export default HarcamaEkleScreen;
