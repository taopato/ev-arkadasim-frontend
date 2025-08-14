import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  'API Hatası',
  'Login hatası',
  'Failed to load resource',
]);

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
import EvGrubuArkadaslarimScreen from './src/screens/EvGrubuArkadaslarimScreen';
import AlacakBorcIcmiScreen from './src/screens/AlacakBorcIcmiScreen';
import HarcamaEkleScreen from './src/screens/HarcamaEkleScreen';
import GroupListScreen from './src/screens/GroupListScreen';
import NewGroupScreen from './src/screens/NewGroupScreen';
import HarcamaTipiSecimScreen from './src/screens/HarcamaTipiSecimScreen';
import HarcamaPaylasimScreen from './src/screens/HarcamaPaylasimScreen';

// **Yeni**: "Borçlarım" ve "Alacaklarım" ekranları
import DebtsScreen from './src/screens/DebtsScreen';
import ReceivablesScreen from './src/screens/ReceivablesScreen';

// **Yeni**: Harcama Yönetimi ekranları
import ExpenseDetailScreen from './src/screens/ExpenseDetailScreen';

// **Yeni**: Davet Sistemi ekranları
import InviteFriendScreen from './src/screens/InviteFriendScreen';
import AcceptInvitationScreen from './src/screens/AcceptInvitationScreen';
import PaymentApprovalScreen from './src/screens/PaymentApprovalScreen';
import CreatePaymentScreen from './src/screens/CreatePaymentScreen';
import BillListScreen from './src/screens/BillListScreen';
import AddBillScreen from './src/screens/AddBillScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import HouseSpendingOverviewScreen from './src/screens/HouseSpendingOverviewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
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
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Ana Menü' }}
            />
            <Stack.Screen
              name="AddHousemate"
              component={AddHousemateScreen}
              options={{ title: 'Ev Arkadaşı Ekle' }}
            />
            <Stack.Screen
              name="HarcamaListesi"
              component={ExpenseListScreen}
              options={{ title: 'Harcama Listesi' }}
            />
            <Stack.Screen
              name="ExpenseListScreen"
              component={ExpenseListScreen}
              options={{ title: 'Harcama Listesi' }}
            />
            <Stack.Screen
              name="DebtSummary"
              component={DebtSummaryScreen}
              options={{ title: 'Borç Özeti' }}
            />
            <Stack.Screen
              name="ExpenseApproval"
              component={ExpenseApprovalScreen}
              options={{ title: 'Borç Ödeme' }}
            />

            {/* Ev Arkadaşlarım / Borçlarım / Alacaklarım */}
            <Stack.Screen
              name="GroupListScreen"
              component={GroupListScreen}
              options={{ title: 'Ev Gruplarım' }}
            />
            <Stack.Screen
              name="EvGrubuArkadaslarimScreen"
              component={EvGrubuArkadaslarimScreen}
              options={{ title: 'Ev Arkadaşlarım' }}
            />

            {/* **Yeni** */}
            <Stack.Screen
              name="Borclarim"
              component={DebtsScreen}
              options={{ title: 'Borçlarım' }}
            />
            <Stack.Screen
              name="Alacaklarim"
              component={ReceivablesScreen}
              options={{ title: 'Alacaklarım' }}
            />
            {/* Eski ekran isimleri ile geriye dönük uyumluluk */}
            <Stack.Screen
              name="DebtsScreen"
              component={DebtsScreen}
              options={{ title: 'Borçlarım' }}
            />
            <Stack.Screen
              name="ReceivablesScreen"
              component={ReceivablesScreen}
              options={{ title: 'Alacaklarım' }}
            />

            {/* **Yeni**: Harcama Yönetimi */}
            <Stack.Screen
              name="ExpenseDetailScreen"
              component={ExpenseDetailScreen}
              options={{ title: 'Harcama Detayı' }}
            />

            {/* Harcama akışı */}
            <Stack.Screen
              name="HarcamaEkleScreen"
              component={HarcamaEkleScreen}
              options={{ title: 'Harcama Ekle' }}
            />
            <Stack.Screen
              name="HarcamaTipiSecim"
              component={HarcamaTipiSecimScreen}
              options={{ title: 'Harcama Tipi Seçimi' }}
            />

            <Stack.Screen
              name="HarcamaPaylasim"
              component={HarcamaPaylasimScreen}
              options={{ title: 'Harcama Paylaşımı' }}
            />

            {/* Detay */}
            <Stack.Screen
              name="AlacakBorcIcmiScreen"
              component={AlacakBorcIcmiScreen}
              options={{ title: 'Alacak / Borç İcmali' }}
            />

            {/* Grup yönetimi */}
            <Stack.Screen
              name="NewGroupScreen"
              component={NewGroupScreen}
              options={{ title: 'Yeni Grup Oluştur' }}
            />

            {/* **Yeni**: Davet Sistemi */}
            <Stack.Screen
              name="InviteFriendScreen"
              component={InviteFriendScreen}
              options={{ title: 'Arkadaş Davet Et' }}
            />
            <Stack.Screen
              name="AcceptInvitationScreen"
              component={AcceptInvitationScreen}
              options={{ title: 'Davet Kabul Et' }}
            />
            <Stack.Screen
              name="PaymentApproval"
              component={PaymentApprovalScreen}
              options={{ title: 'Bekleyen Ödemeler' }}
            />
            <Stack.Screen
              name="CreatePayment"
              component={CreatePaymentScreen}
              options={{ title: 'Ödeme Yap' }}
            />
            <Stack.Screen
              name="BillListScreen"
              component={BillListScreen}
              options={{ title: 'Fatura Listesi' }}
            />
            <Stack.Screen
              name="AddBillScreen"
              component={AddBillScreen}
              options={{ title: 'Fatura Ekle' }}
            />
            <Stack.Screen
              name="BillDetailScreen"
              component={BillDetailScreen}
              options={{ title: 'Fatura Detayı' }}
            />
            <Stack.Screen
              name="HouseSpendingOverviewScreen"
              component={HouseSpendingOverviewScreen}
              options={{ title: 'Harcama Özeti' }}
            />
          </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

AppRegistry.registerComponent('main', () => App);
