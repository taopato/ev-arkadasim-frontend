import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../context/AuthContext';
import { paymentsApi, houseApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const CreatePaymentScreen = ({ navigation, route }) => {
  const { houseId, houseName } = route.params || {};
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

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
        const otherMembers = data.filter(member => 
          member && member.id !== user.id && (member.fullName || member.name)
        );
        setMembers(otherMembers);
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

  const handleToUserChange = (value) => {
    if (value) {
      const selectedMember = members.find(member => 
        member.fullName === value
      );
      
      if (selectedMember && selectedMember.id) {
        setToUserId(selectedMember.id.toString());
      } else {
        setToUserId("");
      }
    } else {
      setToUserId("");
    }
  };

  const handleCreatePayment = async () => {
    if (!amount || !toUserId || !description.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Hata", "Geçerli bir tutar giriniz.");
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        houseId: parseInt(houseId),
        borcluUserId: parseInt(user.id),
        alacakliUserId: parseInt(toUserId),
        tutar: numericAmount,
        method: 'BankTransfer',
        note: description.trim(),
      };

      const response = await paymentsApi.create(paymentData);

      if (response.data) {
        Alert.alert("Başarılı", "Ödeme başarıyla oluşturuldu!", [
          {
            text: "Tamam",
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        throw new Error('Ödeme oluşturulamadı');
      }
    } catch (error) {
      console.error('Ödeme oluşturma hatası:', error);
      Alert.alert("Hata", "Ödeme oluşturulurken bir sorun oluştu: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={CommonStyles.title}>Ödeme Yap</Text>
          <Text style={CommonStyles.subtitle}>
            {houseName || 'Ev'} grubunda arkadaşınıza ödeme yapın
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Ödeme Yapılacak Kişi</Text>
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
                value={toUserId ? members.find(m => m.id.toString() === toUserId)?.fullName || "" : ""}
                onChange={(e) => handleToUserChange(e.target.value)}
              >
                <option key="default-option" value="">Ödeme yapılacak kişiyi seçin</option>
                {members.map((member) => (
                  <option 
                    key={member.id} 
                    value={member.fullName}
                  >
                    {member.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => {
                  const selectedMember = members.find(m => m.fullName === value);
                  if (selectedMember) {
                    setToUserId(selectedMember.id.toString());
                  }
                }}
                value={toUserId ? members.find(m => m.id.toString() === toUserId)?.fullName : null}
                items={members.map(member => ({
                  label: member.fullName,
                  value: member.fullName,
                  key: String(member.id)
                }))}
                placeholder={{ 
                  label: "Ödeme yapılacak kişiyi seçin", 
                  value: null,
                  key: "default-option"
                }}
                style={pickerSelectStyles}
              />
            )}
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Tutar (₺)</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background,
                fontSize: 16,
                color: Colors.text.primary,
              }}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Açıklama</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.neutral[300],
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background,
                fontSize: 16,
                color: Colors.text.primary,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              value={description}
              onChangeText={setDescription}
              placeholder="Ödeme açıklaması (örn: Kira payı, market alışverişi)"
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.payerInfo}>
            Ödeme Yapan: {user?.fullName || 'Bilinmeyen Kullanıcı'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!amount || !toUserId || !description.trim() || loading) && { opacity: 0.5 }
          ]}
          onPress={handleCreatePayment}
          disabled={!amount || !toUserId || !description.trim() || loading}
          activeOpacity={0.8}
        >
          <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.success.background }]}>
            <Text style={CommonStyles.buttonIcon}>💳</Text>
            <Text style={CommonStyles.buttonText}>
              {loading ? "Ödeme Oluşturuluyor..." : "Ödeme Yap"}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Ödeme isteği gönder</Text>
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
  payerInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginVertical: 10
  },
});

export default CreatePaymentScreen;
