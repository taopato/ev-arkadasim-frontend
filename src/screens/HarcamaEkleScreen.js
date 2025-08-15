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
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personalExpenses, setPersonalExpenses] = useState({});
  const [showPersonalExpenses, setShowPersonalExpenses] = useState(false);

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
          member && 
          (member.fullName || member.name) &&
          (member.id || member.userId) // id veya userId kontrolü
        ).map(member => ({
          ...member,
          id: member.id || member.userId, // id yoksa userId'yi kullan
          fullName: member.fullName || member.name // fullName yoksa name'i kullan
        }));

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

  const handlePersonalExpenseChange = (memberId, value) => {
    setPersonalExpenses(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  // Harcama türü değiştiğinde paylaşım türünü otomatik ayarla
  useEffect(() => {
    if (expenseType) {
      setShareType(expenseType);
    }
  }, [expenseType]);

  // Üyeler yüklendiğinde kişisel harcamaları sıfırla
  useEffect(() => {
    if (members.length > 0) {
      const initialPersonalExpenses = {};
      members.forEach(member => {
        initialPersonalExpenses[member.id] = '';
      });
      setPersonalExpenses(initialPersonalExpenses);
    }
  }, [members]);

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

    // Kişisel harcamaları kontrol et
    let totalPersonalExpenses = 0;
    const personalExpensesArray = [];
    
    Object.keys(personalExpenses).forEach(memberId => {
      const personalAmount = parseFloat(personalExpenses[memberId]) || 0;
      if (personalAmount > 0) {
        totalPersonalExpenses += personalAmount;
        personalExpensesArray.push({
          userId: parseInt(memberId),
          amount: personalAmount
        });
      }
    });

    if (totalPersonalExpenses > numericAmount) {
      Alert.alert("Hata", "Kişisel harcamalar toplam tutardan büyük olamaz.");
      return;
    }

         try {
       // Expenses API ile harcama oluştur
       const expenseData = {
         tur: expenseType,
         tutar: numericAmount,
         houseId: parseInt(houseId),
         odeyenUserId: parseInt(payerId),
         kaydedenUserId: user.id
       };
       
       console.log('Gönderilen harcama verisi:', expenseData);
       
       const response = await expensesApi.addExpense(expenseData);

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
       console.error('Hata detayları:', {
         status: error.response?.status,
         data: error.response?.data,
         message: error.message
       });
       Alert.alert("Hata", "Harcama eklenirken bir sorun oluştu: " + (error.response?.data?.message || error.message));
     }
  };

  const expenseTypes = [
    { label: "Market", value: "Market" },
    { label: "Diğer", value: "Diğer" },
    { label: "Yemek", value: "Yemek" },
    { label: "Borç", value: "Borç" },
    { label: "Elektrik", value: "Elektrik" },
    { label: "Su", value: "Su" },
    { label: "Doğalgaz", value: "Doğalgaz" },
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
                <View style={styles.memberSelectionContainer}>
                  {members.map((member) => {
                    const memberId = member?.id?.toString();
                    if (!memberId) {
                      console.warn('Member without ID:', member);
                      return null;
                    }
                    return (
                      <TouchableOpacity
                        key={memberId}
                        style={[
                          styles.memberSelectionButton,
                          payerId === memberId && styles.memberSelectionButtonActive
                        ]}
                        onPress={() => {
                          setPayerId(memberId);
                        }}
                      >
                        <Text style={[
                          styles.memberSelectionButtonText,
                          payerId === memberId && styles.memberSelectionButtonTextActive
                        ]}>
                          {member.fullName || 'İsimsiz Üye'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
             ) : (
               <RNPickerSelect
                 onValueChange={(value) => {
                   const selectedMember = members.find(m => m.fullName === value);
                   if (selectedMember && selectedMember.id) {
                     setPayerId(selectedMember.id.toString());
                   }
                 }}
                 value={payerId ? members.find(m => m.id && m.id.toString() === payerId)?.fullName : null}
                 items={members.filter(member => member.id).map(member => ({
                   label: member.fullName || 'İsimsiz Üye',
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

           <TouchableOpacity 
             style={styles.toggleButton}
             onPress={() => setShowPersonalExpenses(!showPersonalExpenses)}
           >
             <Text style={styles.toggleButtonText}>
               {showPersonalExpenses ? '❌ Kişisel Harcamaları Gizle' : '➕ Kişisel Harcamalar Ekle'}
             </Text>
           </TouchableOpacity>

          <Text style={styles.kaydedenUserInfo}>
            Kaydeden: {user?.fullName || 'Bilinmeyen Kullanıcı'}
          </Text>
        </View>

                 {/* Kişisel Harcamalar */}
         {showPersonalExpenses && expenseType !== '' && (
           <View style={CommonStyles.card}>
             <Text style={styles.sectionTitle}>Kişisel Harcamalar</Text>
             <Text style={styles.sectionSubtitle}>
               Her üyenin kişisel ürünlerinin tutarını girin. Boş bırakırsanız kişisel harcama yok sayılır.
             </Text>
             
                           {members.map((member) => {
                const memberId = member?.id?.toString();
                if (!memberId) {
                  console.warn('Member without ID in personal expenses:', member);
                  return null;
                }
                return (
                  <View key={memberId} style={styles.personalExpenseRow}>
                    <Text style={styles.memberName}>{member.fullName || 'İsimsiz Üye'}</Text>
                    <TextInput
                      key={`personal-expense-${memberId}`}
                      style={styles.personalExpenseInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={personalExpenses[memberId] || ''}
                      onChangeText={(value) => handlePersonalExpenseChange(memberId, value)}
                    />
                  </View>
                );
              })}
             
             <View style={styles.summaryBox}>
               <Text style={styles.summaryText}>
                 💡 <Text style={styles.boldText}>Nasıl çalışır?</Text>
               </Text>
               <Text style={styles.summaryText}>
                 • Kişisel harcamalar toplam tutardan düşülür
               </Text>
               <Text style={styles.summaryText}>
                 • Kalan tutar üyeler arasında eşit paylaştırılır
               </Text>
               <Text style={styles.summaryText}>
                 • Her üye kendi kişisel harcaması + ortak payı öder
               </Text>
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
  toggleButton: {
    backgroundColor: Colors.primary[100],
    borderWidth: 1,
    borderColor: Colors.primary[300],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: Colors.primary[700],
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  personalExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  memberName: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  personalExpenseInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 6,
    padding: 8,
    backgroundColor: Colors.background,
    color: Colors.text.primary,
    fontSize: 16,
    width: 100,
    textAlign: 'right',
  },
  summaryBox: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  memberSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  memberSelectionButton: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    minWidth: 100,
    alignItems: 'center',
  },
  memberSelectionButtonActive: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[500],
  },
  memberSelectionButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  memberSelectionButtonTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
});

export default HarcamaEkleScreen;
