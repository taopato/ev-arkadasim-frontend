import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import api from '../services/api';

const HarcamaPaylasimScreen = ({ route, navigation }) => {
    const { 
        expenseType, 
        amount, 
        payerId, 
        houseId, 
        kaydedenUserId,
        harcamaTipi 
    } = route.params;

    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);
    const [sahsiHarcamalar, setSahsiHarcamalar] = useState({});
    const [kalanTutar, setKalanTutar] = useState(amount);

    // Ev üyelerini getir
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const [membersResponse, usersResponse] = await Promise.all([
                    api.get(`/House/Friends/${houseId}`),
                    api.get('/Users')
                ]);

                // Ev üyeleri ve kullanıcı bilgilerini birleştir
                const memberData = membersResponse.data.map(member => {
                    const user = usersResponse.data.find(u => u.email === member.email);
                    return {
                        ...member,
                        id: user ? user.id : null
                    };
                });

                setMembers(memberData);
                
                // Şahsi harcamalar için başlangıç değerlerini oluştur
                const initialHarcamalar = {};
                memberData.forEach(member => {
                    initialHarcamalar[member.email] = '0';
                });
                setSahsiHarcamalar(initialHarcamalar);
            } catch (error) {
                console.error('Üyeler yüklenirken hata:', error);
                Alert.alert('Hata', 'Ev üyeleri yüklenirken bir hata oluştu.');
            }
        };

        fetchMembers();
    }, [houseId]);

    // Şahsi harcama tutarı değiştiğinde kalan tutarı güncelle
    const handleSahsiHarcamaChange = (email, value) => {
        const numericValue = value.replace(/[^0-9.]/g, '');
        
        setSahsiHarcamalar(prevState => ({
            ...prevState,
            [email]: numericValue
        }));

        // Toplam şahsi harcamaları hesapla
        const yeniSahsiHarcamalar = {
            ...sahsiHarcamalar,
            [email]: numericValue
        };
        
        const toplamSahsiHarcama = Object.values(yeniSahsiHarcamalar)
            .reduce((toplam, tutar) => toplam + (parseFloat(tutar) || 0), 0);
        
        // Kalan tutarı güncelle
        const yeniKalanTutar = amount - toplamSahsiHarcama;
        setKalanTutar(yeniKalanTutar);
    };

    const handleKaydet = async () => {
        try {
            setLoading(true);

            // Tüm sayısal değerleri kontrol et
            const numericAmount = parseFloat(amount);
            const numericHouseId = parseInt(houseId);
            const numericPayerId = parseInt(payerId);
            const numericKaydedenUserId = parseInt(kaydedenUserId);

            if (isNaN(numericAmount) || isNaN(numericHouseId) || 
                isNaN(numericPayerId) || isNaN(numericKaydedenUserId)) {
                Alert.alert('Hata', 'Geçersiz sayısal değerler!');
                return;
            }

            // Şahsi harcamaları düzenle
            const sahsiHarcamalarArray = harcamaTipi === 'sahsi' 
                ? Object.entries(sahsiHarcamalar)
                    .map(([email, tutar]) => {
                        const member = members.find(m => m.email === email);
                        const numericTutar = parseFloat(tutar) || 0;
                        return {
                            userId: member ? parseInt(member.id) : 0,
                            tutar: numericTutar
                        };
                    })
                : [];

            // Kalan tutarı kontrol et
            const numericKalanTutar = parseFloat(kalanTutar.toFixed(2)) || 0;
            if (numericKalanTutar < 0) {
                Alert.alert('Hata', 'Şahsi harcamalar toplamı, toplam tutardan büyük olamaz!');
                return;
            }

            // Tutarların toplamını kontrol et
            const toplamSahsiHarcama = sahsiHarcamalarArray.reduce((toplam, sh) => toplam + sh.tutar, 0);
            if (Math.abs(toplamSahsiHarcama + numericKalanTutar - numericAmount) > 0.01) {
                Alert.alert('Hata', 'Şahsi harcamalar ve ortak harcama toplamı, toplam tutara eşit olmalıdır!');
                return;
            }

            const expenseData = {
                tur: expenseType,
                tutar: numericAmount,
                houseId: numericHouseId,
                odeyenUserId: numericPayerId,
                kaydedenUserId: numericKaydedenUserId,
                sahsiHarcamalar: sahsiHarcamalarArray,
                ortakHarcamaTutari: numericKalanTutar
            };

            console.log('API\'ye gönderilecek veri:', JSON.stringify(expenseData, null, 2));

            const response = await api.post('/Expenses/AddExpense', expenseData);
            console.log('API yanıtı:', response.data);

            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    'Başarılı',
                    'Harcama başarıyla kaydedildi.',
                    [{ text: 'Tamam', onPress: () => navigation.navigate('Home') }]
                );
            }
        } catch (error) {
            console.error('Harcama kaydedilirken hata:', error);
            console.error('Hata detayı:', error.response?.data);
            
            let errorMessage = 'Harcama kaydedilirken bir hata oluştu';
            if (error.response?.data?.message) {
                errorMessage += ': ' + error.response.data.message;
            } else if (error.response?.data) {
                errorMessage += ': ' + JSON.stringify(error.response.data);
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            }

            Alert.alert('Hata', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>
                {harcamaTipi === 'ortak' ? 'Ortak Harcama' : 'Şahsi Harcamalar'}
            </Text>

            <View style={styles.infoCard}>
                <Text style={styles.infoText}>Toplam Tutar: ₺{amount}</Text>
                <Text style={styles.infoText}>
                    Kalan Tutar (Ortak Paylaşılacak): ₺{kalanTutar.toFixed(2)}
                </Text>
            </View>

            {harcamaTipi === 'sahsi' && (
                <View style={styles.membersContainer}>
                    <Text style={styles.subtitle}>Kişisel Harcamalar</Text>
                    {members.map((member, index) => (
                        <View key={`member-${member.email}-${index}`} style={styles.memberRow}>
                            <Text style={styles.memberName}>{member.fullName}</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={sahsiHarcamalar[member.email] || '0'}
                                onChangeText={(value) => handleSahsiHarcamaChange(member.email, value)}
                                placeholder="0.00"
                            />
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleKaydet}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Kaydediliyor...' : 'Harcamayı Kaydet'}
                </Text>
            </TouchableOpacity>

            {loading && (
                <ActivityIndicator 
                    size="large" 
                    color="#0000ff" 
                    style={styles.loader} 
                />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#333'
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#444'
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333'
    },
    membersContainer: {
        marginBottom: 20
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        elevation: 1
    },
    memberName: {
        fontSize: 16,
        flex: 1,
        marginRight: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 8,
        width: 120,
        textAlign: 'right'
    },
    button: {
        backgroundColor: '#28a745',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30
    },
    buttonDisabled: {
        opacity: 0.7
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    loader: {
        marginTop: 20
    }
});

export default HarcamaPaylasimScreen; 