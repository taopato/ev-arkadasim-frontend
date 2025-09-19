// src/screens/CreatePaymentScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Platform, ScrollView, Image, KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../context/AuthContext';
import { paymentsApi, houseApi } from '../services/api';
import { useCommonStyles, makeColorThemes } from '../shared/ui/CommonStyles';
import { useTheme } from '../shared/theme/ThemeProvider';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function CreatePaymentScreen({ navigation, route }) {
  const { houseId, houseName, alacakliUserId, suggestedAmount, chargeId } = route.params || {};
  const { user } = useAuth();
  const CommonStyles = useCommonStyles();
  const { theme } = useTheme();
  const ColorThemes = makeColorThemes(theme);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [method, setMethod] = useState('Cash'); // 'BankTransfer' | 'Cash'
  const [selectedImage, setSelectedImage] = useState(null);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (!houseId) {
      Alert.alert('Hata', 'Geçerli bir ev ID\'si bulunamadı.');
      navigation.goBack();
      return;
    }
    fetchMembers();
  }, [houseId]);

  // Prefill: borç ekranından gelen seçimler
  useEffect(() => {
    if (alacakliUserId) setToUserId(String(alacakliUserId));
    if (suggestedAmount) setAmount(String(suggestedAmount));
  }, [alacakliUserId, suggestedAmount]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await houseApi.getMembers(houseId);
      const body = response?.data;
      const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      const otherMembers = (list || []).filter(m =>
        (m?.userId ?? m?.id) !== user.id && (m?.fullName || m?.name)
      );
      setMembers(otherMembers);
    } catch (error) {
      Alert.alert('Hata', 'Ev üyeleri alınamadı: ' + (error.message || ''));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToUserChange = (value) => setToUserId(value ? String(value) : '');

  const handleCreatePayment = async () => {
    setFormError('');
    if (!amount || !toUserId || !description.trim()) {
      const msg = 'Lütfen tüm alanları doldurun.';
      Alert.alert('Hata', msg);
      setFormError(msg);
      return;
    }
    const numericAmount = Math.abs(parseFloat(String(amount).replace(',', '.')));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      const msg = 'Geçerli bir tutar giriniz.';
      Alert.alert('Hata', msg);
      setFormError(msg);
      return;
    }
    if (method === 'BankTransfer' && !selectedImage) {
      Alert.alert('Eksik', 'IBAN ile ödemede dekont zorunludur.');
      return;
    }

    setLoading(true);
    try {
      // Dekont dosyası hazırla (opsiyonel)
      let dekontFile = null;
      if (method === 'BankTransfer' && selectedImage) {
        if (Platform.OS === 'web') {
          const res = await fetch(selectedImage);
          const blob = await res.blob();
          dekontFile = new File([blob], 'payment_slip.jpg', { type: blob.type || 'image/jpeg' });
        } else {
          dekontFile = { uri: selectedImage, type: 'image/jpeg', name: 'payment_slip.jpg' };
        }
      }

      const payload = {
        houseId: Number(houseId),
        borcluUserId: Number(user.id),
        alacakliUserId: Number(toUserId),
        tutar: Number(numericAmount),
        method,
        note: description.trim(),
        chargeId: chargeId ? Number(chargeId) : undefined,
        dekontFile, // multipart
      };

      const response = await paymentsApi.create(payload);
      if (response?.data) {
        showSuccess('Ödeme başarıyla oluşturuldu!');
        // ödeme listelerini/borçları yenile
        const eventBus = (await import('../shared/events/bus')).default;
        eventBus.emit('payments:updated', { houseId: Number(houseId) });
        setTimeout(() => navigation.goBack(), 1200);
      } else {
        throw new Error('Ödeme oluşturulamadı');
      }
    } catch (error) {
      const msg = 'Ödeme oluşturulurken bir sorun oluştu: ' + (error.response?.data?.message || error.message);
      showError(msg);
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pickerSelectStyles = {
    inputAndroid: {
      borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, padding: 12,
      backgroundColor: theme.colors.background, marginBottom: 16, color: theme.colors.text.primary
    },
    inputIOS: {
      borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, padding: 12,
      backgroundColor: theme.colors.background, marginBottom: 16, color: theme.colors.text.primary
    },
  };

  // izinler
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
      // ❗ web’de hata veren MediaType yerine Options kullan
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <KeyboardAvoidingView style={CommonStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView style={CommonStyles.content} contentInsetAdjustmentBehavior="always" keyboardShouldPersistTaps="handled">
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
                paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
                borderColor: method === 'Cash' ? theme.colors.success[600] : theme.colors.neutral[300],
                backgroundColor: method === 'Cash' ? theme.colors.success[100] : theme.colors.background,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: theme.colors.text.primary }}>Nakit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMethod('BankTransfer')}
              style={{
                paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
                borderColor: method === 'BankTransfer' ? theme.colors.primary[600] : theme.colors.neutral[300],
                backgroundColor: method === 'BankTransfer' ? theme.colors.primary[100] : theme.colors.background,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: theme.colors.text.primary }}>IBAN / Havale</Text>
            </TouchableOpacity>
          </View>

          {/* Kime? */}
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Ödeme Yapılacak Kişi</Text>
            {Platform.OS === 'web' ? (
              <select
                style={{ width: '100%', height: 45, padding: '8px 12px', borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, backgroundColor: theme.colors.background, color: theme.colors.text.primary, fontSize: 16 }}
                value={toUserId || ''}
                onChange={(e) => handleToUserChange(e.target.value)}
              >
                <option key="default-option" value="">Ödeme yapılacak kişiyi seçin</option>
                {members.map((m) => (
                  <option key={String(m.userId ?? m.id)} value={String(m.userId ?? m.id)}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setToUserId(value ? String(value) : '')}
                value={toUserId || null}
                items={members.map(m => ({
                  label: m.fullName, value: String(m.userId ?? m.id), key: String(m.userId ?? m.id)
                }))}
                placeholder={{ label: 'Ödeme yapılacak kişiyi seçin', value: null, key: 'default-option' }}
                style={pickerSelectStyles}
              />
            )}
          </View>

          {/* Tutar */}
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Tutar (₺)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, padding: 12, backgroundColor: theme.colors.background, fontSize: 16, color: theme.colors.text.primary }}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Açıklama */}
          <View style={CommonStyles.inputContainer}>
            <Text style={CommonStyles.label}>Açıklama</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.colors.neutral[300], borderRadius: 8, padding: 12, backgroundColor: theme.colors.background, fontSize: 16, color: theme.colors.text.primary, minHeight: 80, textAlignVertical: 'top' }}
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
              {loading ? 'Ödeme Oluşturuluyor...' : 'Ödeme Yap'}
            </Text>
            <Text style={CommonStyles.buttonSubtext}>Ödeme isteği gönder</Text>
          </View>
        </TouchableOpacity>

          {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          </View>
        )}

        {!!formError && (
          <View style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.error[600] }}>{formError}</Text>
          </View>
        )}
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    loadingOverlay: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)'
    },
    payerInfo: { textAlign: 'center', fontSize: 14, color: theme.colors.text.secondary, fontStyle: 'italic', marginVertical: 10 },
  });
}
