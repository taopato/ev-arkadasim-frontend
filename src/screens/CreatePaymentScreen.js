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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../context/AuthContext';
import { paymentsApi, houseApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';
import { Colors } from '../../constants/Colors';

const CreatePaymentScreen = ({ navigation, route }) => {
  const { houseId, houseName, alacakliUserId, suggestedAmount, chargeId } = route.params || {};
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [method, setMethod] = useState('BankTransfer'); // 'BankTransfer' | 'Cash'
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!houseId) {
      console.error('Ev ID bulunamadı');
      Alert.alert('Hata', 'Geçerli bir ev ID\'si bulunamadı.');
      navigation.goBack();
      return;
    }

    fetchMembers();
  }, [houseId]);

  // Prefill: borç ekranından gelen seçimler
  useEffect(() => {
    if (alacakliUserId) {
      setToUserId(String(alacakliUserId));
    }
    if (suggestedAmount) {
      setAmount(String(suggestedAmount));
    }
  }, [alacakliUserId, suggestedAmount]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await houseApi.getMembers(houseId);
      const body = response?.data;
      const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      if (Array.isArray(list)) {
        const otherMembers = list.filter(member => 
          member && (member.userId ?? member.id) !== user.id && (member.fullName || member.name)
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
      setToUserId(String(value));
    } else {
      setToUserId("");
    }
  };

  const handleCreatePayment = async () => {
    setFormError("");
    console.log('[CreatePayment] submit', { amount, toUserId, method, hasSlip: !!selectedImage });
    if (!amount || !toUserId || !description.trim()) {
      const msg = "Lütfen tüm alanları doldurun.";
      Alert.alert("Hata", msg);
      setFormError(msg);
      return;
    }

    const numericAmount = Math.abs(parseFloat(String(amount).replace(',', '.')));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      const msg = "Geçerli bir tutar giriniz.";
      Alert.alert("Hata", msg);
      setFormError(msg);
      return;
    }

    if (method === 'BankTransfer' && !selectedImage) {
      const msg = 'IBAN ile gönderimde dekont fotoğrafı zorunludur. Lütfen dekont yükleyin.';
      Alert.alert('Hata', msg);
      setFormError(msg);
      return;
    }

    setLoading(true);
    try {
      // Dosya objesi hazırla (IBAN için)
      let slipFile = null;
      if (method === 'BankTransfer' && selectedImage) {
        try {
          if (Platform.OS === 'web') {
            const res = await fetch(selectedImage);
            const blob = await res.blob();
            slipFile = new File([blob], 'payment_slip.jpg', { type: blob.type || 'image/jpeg' });
          } else {
            slipFile = {
              uri: selectedImage,
              type: 'image/jpeg',
              name: 'payment_slip.jpg',
            };
          }
        } catch (e) {
          console.warn('Dekont dosyası hazırlanamadı', e);
        }
      }

      const paymentData = {
        houseId: parseInt(houseId),
        borcluUserId: parseInt(user.id),
        alacakliUserId: parseInt(toUserId),
        tutar: numericAmount,
        method: method,
        note: description.trim(),
        slipFile,
        chargeId: chargeId ? Number(chargeId) : undefined,
      };

      console.log('[CreatePayment] payload', paymentData);
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
      const msg = "Ödeme oluşturulurken bir sorun oluştu: " + (error.response?.data?.message || error.message);
      Alert.alert("Hata", msg);
      setFormError(msg);
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

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Kamera izni gereklidir.');
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Galeri izni gereklidir.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const ok = await requestGalleryPermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const ok = await requestCameraPermission();
    if (!ok) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
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
          {/* Ödeme Yöntemi */}
          <Text style={CommonStyles.label}>Ödeme Yöntemi</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setMethod('Cash')}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: method === 'Cash' ? Colors.success[600] : Colors.neutral[300],
                backgroundColor: method === 'Cash' ? Colors.success[100] : Colors.background,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: Colors.text.primary }}>Nakit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMethod('BankTransfer')}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: method === 'BankTransfer' ? Colors.primary[600] : Colors.neutral[300],
                backgroundColor: method === 'BankTransfer' ? Colors.primary[100] : Colors.background,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: Colors.text.primary }}>IBAN / Havale</Text>
            </TouchableOpacity>
          </View>
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
                value={toUserId || ""}
                onChange={(e) => handleToUserChange(e.target.value)}
              >
                <option key="default-option" value="">Ödeme yapılacak kişiyi seçin</option>
                {members.map((member) => (
                  <option 
                    key={String(member.userId ?? member.id)} 
                    value={String(member.userId ?? member.id)}
                  >
                    {member.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setToUserId(value ? String(value) : "")}
                value={toUserId || null}
                items={members.map(member => ({
                  label: member.fullName,
                  value: String(member.userId ?? member.id),
                  key: String(member.userId ?? member.id)
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
        
          {/* IBAN seçiliyse dekont yükleme */}
          {method === 'BankTransfer' && (
            <View style={CommonStyles.inputContainer}>
              <Text style={CommonStyles.label}>Dekont (Zorunlu)</Text>
              {selectedImage ? (
                <View style={{ alignItems: 'center' }}>
                  <Image source={{ uri: selectedImage }} style={{ width: 220, height: 160, borderRadius: 8, marginBottom: 8 }} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={pickImage} style={CommonStyles.menuButton} activeOpacity={0.8}>
                      <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
                        <Text style={CommonStyles.buttonText}>Galeriden Değiştir</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={takePhoto} style={CommonStyles.menuButton} activeOpacity={0.8}>
                      <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.neutral.background }]}>
                        <Text style={CommonStyles.buttonText}>Fotoğraf Çek</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={pickImage} style={CommonStyles.menuButton} activeOpacity={0.8}>
                    <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.primary.background }]}>
                      <Text style={CommonStyles.buttonText}>📎 Galeriden Yükle</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={takePhoto} style={CommonStyles.menuButton} activeOpacity={0.8}>
                    <View style={[CommonStyles.buttonContent, { backgroundColor: ColorThemes.warning.background }]}>
                      <Text style={CommonStyles.buttonText}>📷 Fotoğraf Çek</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[
            CommonStyles.menuButton,
            (!amount || !toUserId || !description.trim() || loading || (method === 'BankTransfer' && !selectedImage)) && { opacity: 0.5 }
          ]}
          onPress={handleCreatePayment}
          disabled={!amount || !toUserId || !description.trim() || loading || (method === 'BankTransfer' && !selectedImage)}
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

        {!!formError && (
          <View style={{ padding: 12 }}>
            <Text style={{ color: Colors.error[600] }}>{formError}</Text>
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
