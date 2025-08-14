import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { billsApi, houseApi } from '../services/api';
import Toast from '../components/Toast';

const AddBillScreen = ({ route, navigation }) => {
  const { houseId, houseName, categoryName, billId, isEditing } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [billDate, setBillDate] = useState('');
  const [note, setNote] = useState('');
  const [paidByUserId, setPaidByUserId] = useState('');
  const [shareType, setShareType] = useState(categoryName || 'Elektrik');
  const [month, setMonth] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // Animasyonlar
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (!houseId) {
      showToast('Gerekli bilgiler eksik', 'error');
      navigation.goBack();
      return;
    }
    
    // Varsayılan fatura tarihi bugün
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    setBillDate(today);
    // Varsayılan ay (YYYY-MM)
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setMonth(ym);
    
    fetchMembers();
    
    // Düzenleme modunda fatura verilerini yükle
    if (isEditing && billId) {
      fetchBillData();
    }
    
    // Sayfa açılış animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [houseId, billId, isEditing]);

  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const fetchMembers = async () => {
    try {
      const response = await houseApi.getMembers(houseId);
      
      if (response.data && Array.isArray(response.data)) {
        const validMembers = response.data.filter(member => 
          member && (member.fullName || member.name)
        );
        setMembers(validMembers);
        
        // Varsayılan olarak ödeyen kullanıcıyı kendim yap
        if (user && validMembers.length > 0) {
          const currentUserMember = validMembers.find(m => 
            m.userId === user.id || m.id === user.id
          );
          if (currentUserMember) {
            setResponsibleUserId((currentUserMember.userId || currentUserMember.id).toString());
          }
        }
      }
    } catch (error) {
      console.error('Ev üyeleri alınamadı:', error);
      showToast('Ev üyeleri alınamadı: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const response = await billsApi.getById(billId);
      
      if (response.data) {
        const billData = response.data;
        setAmount(billData.amount?.toString() || '');
        setBillDate((billData.billDate || '').split('T')[0]);
        setNote(billData.note || '');
        setPaidByUserId(billData.paidByUserId?.toString() || '');
        setShareType(billData.shareType || shareType);
        
        if (billData.imageUrl) {
          setSelectedImage(billData.imageUrl);
        }
      }
    } catch (error) {
      console.error('Fatura verileri alınamadı:', error);
      showToast('Fatura verileri alınamadı: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        showToast('Dekont seçildi!', 'success');
      }
    } catch (error) {
      console.error('Dekont seçme hatası:', error);
      showToast('Dekont seçilirken bir hata oluştu: ' + error.message, 'error');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        showToast('Kamera izni gereklidir', 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        showToast('Fotoğraf çekildi!', 'success');
      }
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      showToast('Fotoğraf çekilirken bir hata oluştu: ' + error.message, 'error');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Dekont Ekle',
      'Dekont eklemek için bir seçenek seçin:',
      [
        {
          text: 'Galeriden Seç',
          onPress: pickImage,
        },
        {
          text: 'Fotoğraf Çek',
          onPress: takePhoto,
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadDocument = async (billId) => {
    if (!selectedImage) return null;
    
    try {
      const imageFile = {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'bill_document.jpg',
      };
      
      const response = await billsApi.uploadDocument(billId, imageFile);
      
      return response.data?.data?.url || response.data?.url;
    } catch (error) {
      console.error('Dekont yükleme hatası:', error);
      showToast('Dekont yüklenirken bir hata oluştu', 'error');
      return null;
    }
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Lütfen geçerli bir tutar girin', 'warning');
      return false;
    }

    if (!billDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      showToast('Lütfen geçerli bir fatura tarihi girin (YYYY-MM-DD)', 'warning');
      return false;
    }

    return true;
  };

  const handleCreateBill = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Backend'in beklediği şema ile gönder
      const billData = {
        houseId: parseInt(houseId),
        utilityType: parseInt(route.params?.utilityType || 0),
        month: month,
        amount: parseFloat(amount),
        note: note || undefined,
        responsibleUserId: parseInt(responsibleUserId || user.id?.toString()),
        createdByUserId: parseInt(user.id?.toString()),
      };

      let response;
      
      if (isEditing && billId) {
        // Düzenleme modu
        response = await billsApi.update(billId, billData);
        
        // Eğer yeni resim seçildiyse yükle
        if (selectedImage && !selectedImage.startsWith('http')) {
          await uploadDocument(billId);
        }
        
        showToast(`${categoryName} faturası başarıyla güncellendi!`, 'success');
      } else {
        // Yeni fatura oluşturma modu
        response = await billsApi.create(billData);
        
        const newBillId = response.data?.id || response.data?.data?.id || response.data?.data?.billId || response.data?.billId;
        if (newBillId) {
          
          // Eğer resim seçildiyse yükle
          if (selectedImage) {
            await uploadDocument(newBillId);
          }
          
          showToast(`${categoryName} faturası başarıyla oluşturuldu!`, 'success');
          
          // Finalize seçeneği sun
          setTimeout(() => {
            Alert.alert(
              '✅ Başarılı!',
              `${categoryName} faturası başarıyla oluşturuldu.\n\nŞimdi faturayı finalize edebilirsiniz.`,
              [
                {
                  text: 'Finalize Et',
                  onPress: () => handleFinalizeBill(newBillId)
                },
                {
                  text: 'Tamam',
                  onPress: () => navigation.goBack()
                }
              ]
            );
          }, 1000);
        }
      }
      
      // Düzenleme modunda direkt geri dön
      if (isEditing) {
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Fatura işlemi hatası:', error);
      const action = isEditing ? 'güncellenemedi' : 'oluşturulamadı';
      showToast(`Fatura ${action}: ` + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeBill = async (billId) => {
    try {
      const response = await billsApi.finalize(billId, user.id);
      
      const ok = response.data?.data === true || response.data === true;
      if (ok) {
        showToast('Fatura başarıyla finalize edildi ve borç kalemleri oluşturuldu!', 'success');
        
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      console.error('Fatura finalize hatası:', error);
      showToast('Fatura finalize edilemedi: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Düzenle' : 'Yeni'} {categoryName} Faturası</Text>
          <Text style={styles.subtitle}>{houseName}</Text>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Tutar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>💰 Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="Fatura tutarını girin"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Ay */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📅 Ay (YYYY-MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-01"
              value={month}
              onChangeText={setMonth}
              maxLength={7}
            />
          </View>

          {/* Son ödeme tarihi kaldırıldı */}

          {/* Sorumlu Kişi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>👤 Sorumlu Kişi</Text>
            <View style={styles.pickerContainer}>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.userId || member.id}
                  style={[
                    styles.memberButton,
                    (member.userId || member.id) === responsibleUserId && styles.selectedMemberButton
                  ]}
                  onPress={() => setResponsibleUserId(member.userId || member.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.memberButtonText,
                    (member.userId || member.id) === responsibleUserId && styles.selectedMemberButtonText
                  ]}>
                    {member.fullName || member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Not (Opsiyonel) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📝 Not (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Fatura hakkında not ekleyin..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Dekont */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📎 Dekont (Opsiyonel)</Text>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={showImagePickerOptions}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6c757d', '#495057']}
                    style={styles.changeImageButtonGradient}
                  >
                    <Text style={styles.changeImageText}>Dekontu Değiştir</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={showImagePickerOptions}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#007bff', '#0056b3']}
                  style={styles.uploadButtonGradient}
                >
                  <Text style={styles.uploadButtonText}>📎 Dekont Ekle</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Oluştur Butonu */}
          <TouchableOpacity
            style={[styles.createButton, (!amount || !month || !responsibleUserId) && styles.disabledButton]}
            onPress={handleCreateBill}
            disabled={loading || !amount || !month || !responsibleUserId}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(!amount || !month || !responsibleUserId) ? ['#6c757d', '#495057'] : ['#28a745', '#20c997']}
              style={styles.createButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>✅ {isEditing ? 'Faturayı Güncelle' : 'Fatura Oluştur'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,

  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberButton: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedMemberButton: {
    borderColor: '#007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
  },
  memberButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  selectedMemberButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  uploadButtonGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
  },
  changeImageButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    marginTop: 20,
  },
  createButtonGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddBillScreen;
