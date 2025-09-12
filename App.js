import 'react-native-gesture-handler';
import React from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/shared/theme/ThemeProvider';
import { AuthProvider } from './src/context/AuthContext';

// Console uyarılarını bastır
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted from react-native core',
  'ViewPropTypes will be removed from React Native',
  'ColorPropType will be removed from React Native',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Require cycle:',
  'React DevTools',
  'Running application',
  'Development-level warnings',
  'Performance optimizations',
  'TurboModuleRegistry.getEnforcing',
  'PlatformConstants',
  'API Hatası',
  'Login hatası',
  'Failed to load resource',
  'Invariant Violation',
  'TurboModuleRegistry',
  'could not be found',
  'Verify that a module by this name is registered',
  'native binary',
  'js engine: hermes',
  'runtime not ready',
]);

// Tüm LogBox uyarılarını bastır (geçici)
LogBox.ignoreAllLogs(true);

// Console uyarılarını da bastır
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('pointerEvents') ||
      message.includes('React DevTools') ||
      message.includes('Running application') ||
      message.includes('Development-level warnings') ||
      message.includes('Performance optimizations') ||
      message.includes('API Hatası') ||
      message.includes('Login hatası') ||
      message.includes('Failed to load resource')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// React Query client'ı oluştur
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 dakika
    },
    mutations: {
      retry: 1,
    },
  },
});

// Ekranların içe aktarılması
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddHousemateScreen from './src/screens/AddHousemateScreen';
import ExpenseListScreen from './src/screens/ExpenseListScreen';
import DebtSummaryScreen from './src/screens/DebtSummaryScreen';
import ExpenseApprovalScreen from './src/screens/ExpenseApprovalScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import HouseMembersScreen from './src/screens/HouseMembersScreen';
import ReceivablesDebtsSummaryScreen from './src/screens/ReceivablesDebtsSummaryScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import GroupListScreen from './src/screens/GroupListScreen';
import NewGroupScreen from './src/screens/NewGroupScreen';

// **Yeni**: "Borçlarım" ve "Alacaklarım" ekranları
import DebtsScreen from './src/screens/DebtsScreen';
import ReceivablesScreen from './src/screens/ReceivablesScreen';
import MyReceivablesScreen from './src/screens/MyReceivablesScreen';

// **Yeni**: Harcama Yönetimi ekranları
import ExpenseDetailScreen from './src/screens/ExpenseDetailScreen';

// **Yeni**: Davet Sistemi ekranları
import InviteFriendScreen from './src/screens/InviteFriendScreen';
import AcceptInvitationScreen from './src/screens/AcceptInvitationScreen';
import PaymentApprovalScreen from './src/screens/PaymentApprovalScreen';
import CreatePaymentScreen from './src/screens/CreatePaymentScreen';
import HouseSpendingOverviewScreen from './src/screens/HouseSpendingOverviewScreen';
import BillsOverviewScreen from './src/screens/BillsOverviewScreen';
import AddBillScreen from './src/screens/AddBillScreen';
import UtilityBillCreateScreen from './src/screens/UtilityBillCreateScreen';
import PendingContributionsScreen from './src/screens/PendingContributionsScreen';
import TwoPersonDebtDetailScreen from './src/screens/TwoPersonDebtDetailScreen';
// Eksik kayıtlar: HomeScreen düğmeleri için
import ExpensesScreen from './src/screens/ExpensesScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import PendingPaymentsScreen from './src/screens/PendingPaymentsScreen';
// Ek akışlar
import EvGrubuArkadaslarimScreen from './src/screens/EvGrubuArkadaslarimScreen';
import ChargesList from './src/screens/ChargesListScreen';
// NewRecurringCharge ekranını AddBillScreen ile birleştiriyoruz
import BillListScreen from './src/screens/BillListScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import HarcamaEkleScreen from './src/screens/HarcamaEkleScreen';
import AlacakBorcIcmiScreen from './src/screens/AlacakBorcIcmiScreen';
import NewRecurringChargeScreen from './src/screens/NewRecurringChargeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            {/* Login ve Register Ekranları */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Giriş Yap' }}
            />

            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Kayıt Ol' }}
            />
            <Stack.Screen
              name="ForgotPasswordScreen"
              component={ForgotPasswordScreen}
              options={{ title: 'Şifremi Unuttum' }}
            />
            {/* Yeni: Şifre Sıfırla */}
            <Stack.Screen
              name="ResetPasswordScreen"
              component={require('./src/screens/ResetPasswordScreen').default}
              options={{ title: 'Şifreyi Sıfırla' }}
            />

            {/* Kayıt ve Doğrulama Ekranları */}
            <Stack.Screen
              name="SignupScreen"
              component={SignupScreen}
              options={{ title: 'Kayıt Ol' }}
            />
            <Stack.Screen
              name="VerificationScreen"
              component={VerificationScreen}
              options={{ title: 'Doğrulama' }}
            />

            {/* Ana Menü ve Alt Ekranlar */}
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Menü' }} />
            {/* Eksik ekran kayıtları eklendi */}
            <Stack.Screen name="ExpensesScreen" component={ExpensesScreen} options={{ title: 'Harcamalar' }} />
            <Stack.Screen name="PaymentsScreen" component={PaymentsScreen} options={{ title: 'Ödemeler' }} />
            <Stack.Screen name="PendingPaymentsScreen" component={PendingPaymentsScreen} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen
              name="AddHousemate"
              component={AddHousemateScreen}
              options={{ title: '👤 Ev Arkadaşı Ekle' }}
            />
            <Stack.Screen
              name="HarcamaListesi"
              component={ExpenseListScreen}
              options={{ title: '📋 Harcama Listesi (GetExpenses)' }}
            />
            <Stack.Screen
              name="ExpenseListScreen"
              component={ExpenseListScreen}
              options={{ title: '📋 Harcama Listesi (GetExpenses)' }}
            />
            <Stack.Screen name="DebtSummaryScreen" component={DebtSummaryScreen} options={{ title: 'Borç Özeti' }} />
            <Stack.Screen
              name="ExpenseApproval"
              component={ExpenseApprovalScreen}
              options={{ title: '✅ Harcama Onayı' }}
            />

            {/* Ev Arkadaşlarım / Borçlarım / Alacaklarım */}
            <Stack.Screen
              name="GroupListScreen"
              component={GroupListScreen}
              options={{ title: '🏘️ Ev Gruplarım' }}
            />
            <Stack.Screen name="HouseMembersScreen" component={HouseMembersScreen} options={{ title: 'Ev Arkadaşları' }} />

            {/* **Yeni**: "Borçlarım" ve "Alacaklarım" ekranları */}
            <Stack.Screen name="DebtsScreen" component={DebtsScreen} options={{ title: 'Borçlarım' }} />
            <Stack.Screen name="ReceivablesScreen" component={ReceivablesScreen} options={{ title: 'Alacaklarım' }} />
            <Stack.Screen name="MyReceivables" component={MyReceivablesScreen} options={{ title: 'Alacaklarım' }} />

            {/* **Yeni**: Harcama Yönetimi */}
            <Stack.Screen name="ExpenseDetailScreen" component={ExpenseDetailScreen} options={{ title: 'Harcama Detayı' }} />

            {/* Harcama akışı */}
            <Stack.Screen name="AddExpenseScreen" component={AddExpenseScreen} options={{ title: 'Harcama Ekle' }} />

            {/* Detay */}
            <Stack.Screen name="ReceivablesDebtsSummaryScreen" component={ReceivablesDebtsSummaryScreen} options={{ title: 'Alacak/Borç Özeti' }} />

            {/* Grup yönetimi */}
            <Stack.Screen
              name="NewGroupScreen"
              component={NewGroupScreen}
              options={{ title: '🏘️ Yeni Grup Oluştur' }}
            />
            <Stack.Screen
              name="EvGrubuArkadaslarimScreen"
              component={EvGrubuArkadaslarimScreen}
              options={{ title: 'Ev Arkadaşlarım' }}
            />

            {/* **Yeni**: Davet Sistemi */}
            <Stack.Screen name="InviteFriendScreen" component={InviteFriendScreen} options={{ title: 'Arkadaş Davet Et' }} />
            <Stack.Screen name="AcceptInvitationScreen" component={AcceptInvitationScreen} options={{ title: 'Davet Kabul Et' }} />
            <Stack.Screen name="PaymentApproval" component={PaymentApprovalScreen} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen name="BillsOverviewScreen" component={BillsOverviewScreen} options={{ title: 'Faturalar' }} />
            <Stack.Screen name="AddBillScreen" component={AddBillScreen} options={{ title: 'Yeni Fatura' }} />
            <Stack.Screen name="BillListScreen" component={BillListScreen} options={{ title: 'Faturalar' }} />
            <Stack.Screen name="BillDetailScreen" component={BillDetailScreen} options={{ title: 'Fatura Detayı' }} />
            <Stack.Screen name="UtilityBillCreate" component={UtilityBillCreateScreen} options={{ title: 'Fatura Oluştur' }} />
            <Stack.Screen
              name="PendingContributions"
              component={PendingContributionsScreen}
              options={{ title: 'Bekleyen Katkılar' }}
            />
            <Stack.Screen name="CreatePayment" component={CreatePaymentScreen} options={{ title: 'Ödeme Yap' }} />
            <Stack.Screen name="ChargesList" component={ChargesList} options={{ title: 'Gider Dönemleri' }} />
            <Stack.Screen
              name="NewRecurringCharge"
              component={AddBillScreen}
              options={{ title: 'Düzenli Gider Ekle' }}
              initialParams={{ isEditing: false }}
            />
            {/* Uyum için: bazı yerlerde bu adla çağrılıyor */}
            <Stack.Screen
              name="NewRecurringChargeScreen"
              component={NewRecurringChargeScreen}
              options={{ title: 'Düzenli Gider Ekle' }}
            />
            <Stack.Screen name="HarcamaEkleScreen" component={HarcamaEkleScreen} options={{ title: 'Harcama Ekle' }} />
            <Stack.Screen name="AlacakBorcIcmiScreen" component={AlacakBorcIcmiScreen} options={{ title: 'Borç/Alacak Detayı' }} />
            <Stack.Screen name="HouseSpendingOverviewScreen" component={HouseSpendingOverviewScreen} options={{ title: 'Harcama Özeti' }} />
            <Stack.Screen
              name="TwoPersonDebtDetail"
              component={TwoPersonDebtDetailScreen}
              options={{ title: '👥 İkili Borç/Alacak Detayı' }}
            />
          </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// AppRegistry.registerComponent('main', () => App); // Expo managed workflow için gerekli değil
