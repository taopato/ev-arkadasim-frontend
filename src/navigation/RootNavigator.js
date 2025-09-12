// src/navigation/RootNavigator.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ekranlar – hepsi default import olmalı
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import NewGroupScreen from '../screens/NewGroupScreen';
import MyReceivablesScreen from '../screens/MyReceivablesScreen';
import ReceivablesScreen from '../screens/ReceivablesScreen';
import PaymentApprovalScreen from '../screens/PaymentApprovalScreen';
import PendingContributionsScreen from '../screens/PendingContributionsScreen';
import ReceivablesDebtsSummaryScreen from '../screens/ReceivablesDebtsSummaryScreen';
import TwoPersonDebtDetailScreen from '../screens/TwoPersonDebtDetailScreen';
import UtilityBillCreateScreen from '../screens/UtilityBillCreateScreen';
import InviteFriendScreen from '../screens/InviteFriendScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerBackTitle: 'Geri' }}>
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="VerificationScreen" component={VerificationScreen} options={{ title: 'Doğrulama' }} />
        <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} options={{ title: 'Şifre Sıfırla' }} />

        {/* App */}
        {/* <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} /> */}
        <Stack.Screen name="NewGroupScreen" component={NewGroupScreen} options={{ title: 'Yeni Ev Grubu' }} />
        <Stack.Screen name="MyReceivablesScreen" component={MyReceivablesScreen} options={{ title: 'Alacaklarım' }} />
        <Stack.Screen name="ReceivablesScreen" component={ReceivablesScreen} options={{ title: 'Alacaklar' }} />
        <Stack.Screen name="PaymentApprovalScreen" component={PaymentApprovalScreen} options={{ title: 'Ödeme Onayı' }} />
        <Stack.Screen name="PendingContributionsScreen" component={PendingContributionsScreen} options={{ title: 'Bekleyen Katkılar' }} />
        <Stack.Screen name="ReceivablesDebtsSummaryScreen" component={ReceivablesDebtsSummaryScreen} options={{ title: 'Özet' }} />
        <Stack.Screen name="TwoPersonDebtDetailScreen" component={TwoPersonDebtDetailScreen} options={{ title: 'Kişi Detayı' }} />
        <Stack.Screen name="UtilityBillCreateScreen" component={UtilityBillCreateScreen} options={{ title: 'Fatura' }} />
        <Stack.Screen name="InviteFriendScreen" component={InviteFriendScreen} options={{ title: 'Davet' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
