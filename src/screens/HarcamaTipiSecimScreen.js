import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';

const HarcamaTipiSecimScreen = ({ route, navigation }) => {
    const { expenseType, amount, payerId, houseId, kaydedenUserId } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bu harcama nasıl paylaştırılsın?</Text>
            
            <TouchableOpacity 
                style={[styles.button, styles.ortakButton]}
                onPress={() => {
                    navigation.navigate('HarcamaPaylasim', {
                        ...route.params,
                        harcamaTipi: 'ortak'
                    });
                }}
            >
                <Text style={styles.buttonText}>Ortak Harcama</Text>
                <Text style={styles.buttonDescription}>
                    Toplam tutar ev arkadaşları arasında eşit paylaştırılır
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, styles.sahsiButton]}
                onPress={() => {
                    navigation.navigate('HarcamaPaylasim', {
                        ...route.params,
                        harcamaTipi: 'sahsi'
                    });
                }}
            >
                <Text style={styles.buttonText}>Şahsi Harcamalar Var</Text>
                <Text style={styles.buttonDescription}>
                    Kişilere özel harcama tutarları girilir, kalan tutar ortak paylaştırılır
                </Text>
            </TouchableOpacity>
        </View>
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
        marginBottom: 32,
        color: '#333'
    },
    button: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    ortakButton: {
        backgroundColor: '#28a745'
    },
    sahsiButton: {
        backgroundColor: '#007bff'
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8
    },
    buttonDescription: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9
    }
});

export default HarcamaTipiSecimScreen; 