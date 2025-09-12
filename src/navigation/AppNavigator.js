// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

// Auth
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// App
import HomeScreen from '../screens/HomeScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import UtilityBillCreateScreen from '../screens/UtilityBillCreateScreen';
import BillsOverviewScreen from '../screens/BillsOverviewScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import PendingPaymentsScreen from '../screens/PendingPaymentsScreen';
import DebtSummaryScreen from '../screens/DebtSummaryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import CreatePaymentScreen from '../screens/CreatePaymentScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // splash/place-holder göstermek isterseniz ekleyin

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} options={{ title: 'Kayıt Ol' }} />
            <Stack.Screen name="VerificationScreen" component={VerificationScreen} options={{ title: 'Doğrulama' }} />
            <Stack.Screen name="ForgotPasswordScreen" component={ResetPasswordScreen} options={{ title: 'Şifre Sıfırla' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Ev Arkadaşım' }} />
            <Stack.Screen name="ExpensesScreen" component={ExpensesScreen} options={{ title: 'Harcamalar' }} />
            <Stack.Screen name="UtilityBillCreate" component={UtilityBillCreateScreen} options={{ title: 'Fatura' }} />
            <Stack.Screen name="BillsOverviewScreen" component={BillsOverviewScreen} options={{ title: 'Faturalar' }} />
            <Stack.Screen name="PaymentsScreen" component={PaymentsScreen} options={{ title: 'Ödemeler' }} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
            <Stack.Screen name="LanguageSettingsScreen" component={LanguageSettingsScreen} options={{ title: 'Dil' }} />
            <Stack.Screen name="ThemeSettingsScreen" component={ThemeSettingsScreen} options={{ title: 'Tema' }} />
            <Stack.Screen name="CreatePaymentScreen" component={CreatePaymentScreen} options={{ title: 'Ödeme Ekle' }} />
            <Stack.Screen name="PendingPaymentsScreen" component={PendingPaymentsScreen} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen name="DebtSummaryScreen" component={DebtSummaryScreen} options={{ title: 'Borç/Alacak Özeti' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
