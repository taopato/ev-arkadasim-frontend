// src/navigation/RootNavigator.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ekranlar – hepsi default import olmalı
import GirisYap from '../screens/GirisYap';
import KayitOl from '../screens/KayitOl';
import Dogrulama from '../screens/Dogrulama';
import SifreSifirla from '../screens/SifreSifirla';

import YeniEvGrubu from '../screens/YeniEvGrubu';
import Alacaklarim from '../screens/Alacaklarim';
import Alacaklar from '../screens/AlacaklarListesi';
import OdemeOnayi from '../screens/OdemeOnayi';
import BekleyenKatkilar from '../screens/BekleyenKatkilar';
import Ozet from '../screens/Ozet';
import KisiDetayi from '../screens/KisiDetayi';
import FaturaOlustur from '../screens/FaturaOlustur';
import DavetEt from '../screens/DavetEt';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerBackTitle: 'Geri' }}>
        {/* Auth */}
        <Stack.Screen name="Login" component={GirisYap} options={{ headerShown: false }} />
        <Stack.Screen name="SignupScreen" component={KayitOl} options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="VerificationScreen" component={Dogrulama} options={{ title: 'Doğrulama' }} />
        <Stack.Screen name="ResetPasswordScreen" component={SifreSifirla} options={{ title: 'Şifre Sıfırla' }} />

        {/* App */}
        {/* <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} /> */}
        <Stack.Screen name="NewGroupScreen" component={YeniEvGrubu} options={{ title: 'Yeni Ev Grubu' }} />
        <Stack.Screen name="MyReceivablesScreen" component={Alacaklarim} options={{ title: 'Alacaklarım' }} />
        <Stack.Screen name="ReceivablesScreen" component={Alacaklar} options={{ title: 'Alacaklar' }} />
        <Stack.Screen name="PaymentApprovalScreen" component={OdemeOnayi} options={{ title: 'Ödeme Onayı' }} />
        <Stack.Screen name="PendingContributionsScreen" component={BekleyenKatkilar} options={{ title: 'Bekleyen Katkılar' }} />
        <Stack.Screen name="ReceivablesDebtsSummaryScreen" component={Ozet} options={{ title: 'Özet' }} />
        <Stack.Screen name="TwoPersonDebtDetailScreen" component={KisiDetayi} options={{ title: 'Kişi Detayı' }} />
        <Stack.Screen name="UtilityBillCreateScreen" component={FaturaOlustur} options={{ title: 'Fatura' }} />
        <Stack.Screen name="InviteFriendScreen" component={DavetEt} options={{ title: 'Davet' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
