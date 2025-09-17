// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

// Auth
import GirisYap from '../screens/GirisYap';
import KayitOl from '../screens/KayitOl';
import Dogrulama from '../screens/Dogrulama';
import SifreSifirla from '../screens/SifreSifirla';

// App
import AnaSayfa from '../screens/AnaSayfa';
import Harcamalar from '../screens/Harcamalar';
import FaturaOlustur from '../screens/FaturaOlustur';
import Faturalar from '../screens/Faturalar';
import Odemeler from '../screens/Odemeler';
import BekleyenOdemeler from '../screens/BekleyenOdemeler';
import BorcAlacakOzeti from '../screens/BorcAlacakOzeti';
import Ayarlar from '../screens/Ayarlar';
import DilAyarlari from '../screens/DilAyarlari';
import TemaAyarlari from '../screens/TemaAyarlari';
import OdemeEkle from '../screens/OdemeEkle';
import LedgerDetailScreen from '../screens/DefterDetayi';
import GrupListesi from '../screens/GrupListesi';
import EvUyeleri from '../screens/EvUyeleri';
import AlacakBorcIcmi from '../screens/AlacakBorcIcmi';

// Yeni Harcama Ekranları
import TumHarcamalarTestScreen from '../screens/TumHarcamalarTest';
import HarcamaEkle from '../screens/HarcamaEkle';
import DuzenliGiderEkle from '../screens/DuzenliGiderEkle';
// import HarcamaDetayi from '../screens/HarcamaDetayi';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // splash/place-holder göstermek isterseniz ekleyin

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={GirisYap} options={{ title: 'Giriş Yap' }} />
            <Stack.Screen name="SignupScreen" component={KayitOl} options={{ title: 'Kayıt Ol' }} />
            <Stack.Screen name="VerificationScreen" component={Dogrulama} options={{ title: 'Doğrulama' }} />
            <Stack.Screen name="ForgotPasswordScreen" component={SifreSifirla} options={{ title: 'Şifre Sıfırla' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={AnaSayfa} options={{ title: 'Ev Arkadaşım' }} />
            
            {/* Mevcut Ekranlar */}
            <Stack.Screen name="ExpensesScreen" component={Harcamalar} options={{ title: 'Harcamalar' }} />
            <Stack.Screen name="UtilityBillCreate" component={FaturaOlustur} options={{ title: 'Fatura' }} />
            <Stack.Screen name="BillsOverviewScreen" component={Faturalar} options={{ title: 'Faturalar' }} />
            <Stack.Screen name="PaymentsScreen" component={Odemeler} options={{ title: 'Ödemeler' }} />
            <Stack.Screen name="SettingsScreen" component={Ayarlar} options={{ title: 'Ayarlar' }} />
            <Stack.Screen name="LanguageSettingsScreen" component={DilAyarlari} options={{ title: 'Dil' }} />
            <Stack.Screen name="ThemeSettingsScreen" component={TemaAyarlari} options={{ title: 'Tema' }} />
            <Stack.Screen name="CreatePaymentScreen" component={OdemeEkle} options={{ title: 'Ödeme Ekle' }} />
            <Stack.Screen name="PendingPaymentsScreen" component={BekleyenOdemeler} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen name="DebtSummaryScreen" component={BorcAlacakOzeti} options={{ title: 'Borç/Alacak Özeti' }} />
            <Stack.Screen name="LedgerDetail" component={LedgerDetailScreen} options={{ title: 'Borç/Alacak Detayları' }} />
            
            {/* Ev Yönetimi */}
            <Stack.Screen name="GrupListesi" component={GrupListesi} options={{ title: 'Ev Gruplarım' }} />
            <Stack.Screen name="EvUyeleri" component={EvUyeleri} options={{ title: 'Ev Üyeleri' }} />
            <Stack.Screen name="AlacakBorcIcmi" component={AlacakBorcIcmi} options={{ title: 'Borç/Alacak Detayı' }} />
            
            {/* Yeni Harcama Ekranları */}
            <Stack.Screen name="TumHarcamalar" component={TumHarcamalarTestScreen} options={{ title: 'Tüm Harcamalar' }} />
            <Stack.Screen name="HarcamaEkle" component={HarcamaEkle} options={{ title: 'Harcama Ekle' }} />
            <Stack.Screen name="DuzenliGiderEkle" component={DuzenliGiderEkle} options={{ title: 'Düzenli Gider Ekle' }} />
            {/* <Stack.Screen name="HarcamaDetayi" component={HarcamaDetayi} options={{ title: 'Harcama Detayı' }} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
