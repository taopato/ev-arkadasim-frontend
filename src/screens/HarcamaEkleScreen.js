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
  ScrollView,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useAuth } from "../context/AuthContext";
import { expensesApi, houseApi } from "../services/api";
import { CommonStyles, ColorThemes } from "../shared/ui/CommonStyles";
import { Colors } from "../../constants/Colors";

const HarcamaEkleScreen = ({ navigation, route }) => {
  const { houseId } = route.params || {};
  const { user } = useAuth();

  const [expenseType, setExpenseType] = useState("");
  const [shareType, setShareType] = useState("");
  const [commonAmount, setCommonAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Expenses API kullanıyoruz

  useEffect(() => {
    if (!houseId) {
      console.error('Ev ID bulunamadı');
      Alert.alert('Hata', 'Geçerli bir ev ID\'si bulunamadı.');
      navigation.goBack();
      return;
    }

    fetchMembers();
  }, [houseId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await houseApi.getMembers(houseId);
      const data = response.data;
      if (data && Array.isArray(data)) {
        const validMembers = data.filter(member => 
          member && (member.fullName || member.name)
        );
        setMembers(validMembers);
      } else {
        console.error('Üye bulunamadı');
        setMembers([]);
      }
    } catch (error) {
      console.error('Ev üyeleri alınamadı:', error);
      Alert.alert('Hata', 'Ev üyeleri alınamadı: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayerChange = (value) => {
    if (value) {
      const selectedMember = members.find(member => 
        member.fullName === value
      );
      
      if (selectedMember && selectedMember.id) {
        setPayerId(selectedMember.id.toString());
      } else {
        setPayerId("");
      }
    } else {
      setPayerId("");
    }
  };

  const handleDevamEt = async () => {
    if (!expenseType || !amount || !payerId) {
        Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
        return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        Alert.alert("Hata", "Geçerli bir tutar giriniz.");
        return;
    }

    // Ortak harcama tutarı kontrolü
    const numericCommon = commonAmount ? parseFloat(commonAmount) : numericAmount;
    if (isNaN(numericCommon) || numericCommon < 0) {
      Alert.alert("Hata", "Geçerli bir ortak harcama tutarı giriniz.");
      return;
    }
    if (numericCommon > numericAmount) {
      Alert.alert("Hata", "Ortak harcama tutarı toplam tutardan büyük olamaz.");
      return;
    }

    try {
      // Expenses API ile harcama oluştur
      const response = await expensesApi.addExpense({
        tur: expenseType === 'Kira' ? 'Kira' : expenseType,
        tutar: numericAmount,
        ortakHarcamaTutari: numericCommon,
        houseId: parseInt(houseId),
        odeyenUserId: parseInt(payerId),
        kaydedenUserId: user.id,
        paylasimTuru: expenseType === 'Kira' ? 'Kira' : (shareType || expenseType),
        sahsiHarcamalar: []
      });

      if (response.data) {
        Alert.alert("Başarılı", "Harcama başarıyla eklendi!", [
          {
            text: "Tamam",
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        throw new Error('Harcama eklenemedi');
      }
    } catch (error) {
      console.error('Harcama ekleme hatası:', error);
      Alert.alert("Hata", "Harcama eklenirken bir sorun oluştu: " + (error.response?.data?.message || error.message));
    }
  };

  const expenseTypes = [
    { label: "Ortak", value: "Ortak" },
    { label: "Kira", value: "Kira" },
    { label: "Elektrik", value: "Elektrik" },
    { label: "Su", value: "Su" },
    { label: "Yemek", value: "Yemek" },
    { label: "Diğer", value: "Diğer" },
  ];

  const pickerSelectStyles = {
    inputAndroid: { 
      borderWidth: 1, 
      borderColor: Colors.neutral[300], 
      borderRadius: 8, 
      padding: 12, 
      backgroundColor: Colors.background, 
      marginBottom: 16,
      color: Colors.text.primary
    },
    inputIOS: { 
      borderWidth: 1, 
      borderColor: Colors.neutral[300], 
      borderRadius: 8, 
      padding: 12, 
      backgroundColor: Colors.background, 
      marginBottom: 16,
      color: Colors.text.primary
    },
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView style={CommonStyles.content}>
        <View style={CommonStyles.header}>
          <Text style={CommonStyles.title}>Harcama Ekle</Text>
          <Text style={CommonStyles.subtitle}>Yeni bir harcama kaydı oluşturun</Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Harcama Türü</Text>
            {Platform.OS === 'web' ? (
              <select
                style={{
                  width: '100%',
                  height: 45,
                  padding: '8px 12px',
                  borderWidth: 1,
                  borderColor: Colors.neutral[300],
                  borderRadius: 8,
                  backgroundColor: Colors.background,
                  color: Colors.text.primary,
                  fontSize: 16,
                }}
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
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Harcama Tutarı</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background,
                fontSize: 16,
              }}
              placeholder="Harcama tutarını girin"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Ödemeyi Yapan</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.selectContainer}>
                <select
                  style={{
                    width: '100%',
                    height: 45,
                    padding: '8px 12px',
                    borderWidth: 1,
                    borderColor: Colors.neutral[300],
                    borderRadius: 8,
                    backgroundColor: Colors.background,
                    color: Colors.text.primary,
                    fontSize: 16,
                  }}
                  value={payerId ? members.find(m => m.id.toString() === payerId)?.fullName || "" : ""}
                  onChange={(e) => handlePayerChange(e.target.value)}
                >
                  <option key="default-option" value="">Üyelerden birini seçin</option>
                  {members.map((member) => (
                    <option 
                      key={member.id} 
                      value={member.fullName}
                    >
                      {member.fullName}
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
                  label: member.fullName,
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
          </View>

          <Text style={styles.kaydedenUserInfo}>
            Kaydeden: {user?.fullName || 'Bilinmeyen Kullanıcı'}
          </Text>
        </View>

        {/* Paylaşım Türü ve Ortak Tutar */}
        {expenseType !== '' && (
          <View style={CommonStyles.card}>
            <View style={CommonStyles.inputContainer}>
              <Text style={CommonStyles.label}>Paylaşım Türü</Text>
              {Platform.OS === 'web' ? (
                <select
                  style={{
                    width: '100%',
                    height: 45,
                    padding: '8px 12px',
                    borderWidth: 1,
                    borderColor: Colors.neutral[300],
                    borderRadius: 8,
                    backgroundColor: expenseType === 'Kira' ? Colors.neutral[100] : Colors.background,
                    color: Colors.text.primary,
                    fontSize: 16,
                  }}
                  value={expenseType === 'Kira' ? 'Kira' : (shareType || '')}
                  onChange={(e) => setShareType(e.target.value)}
                  disabled={expenseType === 'Kira'}
                >
                  <option key="share-type-default" value="">Paylaşım türü seçin</option>
                  {expenseTypes.map((type) => (
                    <option key={`share-type-${type.value}`} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              ) : (
                <RNPickerSelect
                  onValueChange={(value) => setShareType(value || '')}
                  value={expenseType === 'Kira' ? 'Kira' : (shareType || null)}
                  items={expenseTypes}
                  placeholder={{ label: 'Paylaşım türü seçin', value: null }}
                  style={pickerSelectStyles}
                  disabled={expenseType === 'Kira'}
                />
              )}
            </View>

            <View style={CommonStyles.inputContainer}>
              <Text style={CommonStyles.label}>Ortak Harcama Tutarı</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: Colors.neutral[300],
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: Colors.background,
                  fontSize: 16,
                }}
                placeholder="Ortak harcama tutarı"
                keyboardType="numeric"
                value={commonAmount}
                onChangeText={setCommonAmount}
              />
              {expenseType === 'Kira' && (
                <Text style={{ color: Colors.text.secondary, marginTop: 6 }}>
                  Kira seçiliyken tür ve paylaşım türü kilitlidir.
                </Text>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!expenseType || !amount || !payerId || loading) && { opacity: 0.5 }
          ]}
          onPress={handleDevamEt}
          disabled={!expenseType || !amount || !payerId || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>💰</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Ekleniyor..." : "Devam Et"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Harcama detaylarını belirleyin</Text>
          </View>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  kaydedenUserInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginVertical: 10
  },
  selectContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16
  }
});

export default HarcamaEkleScreen;
