import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';

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

const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Şifremi Unuttum' }}
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
            name="DebtSummary"
            component={DebtSummaryScreen}
            options={{ title: 'Borç Özeti' }}
          />
          <Stack.Screen
            name="ExpenseApproval"
            component={ExpenseApprovalScreen}
            options={{ title: 'Harcama Onayı' }}
          />

          {/* Grup ve Harcama Ekranları */}
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
          <Stack.Screen
            name="HarcamaEkleScreen"
            component={HarcamaEkleScreen}
            options={{ title: 'Harcama Ekle' }}
          />
          <Stack.Screen
            name="NewGroupScreen"
            component={NewGroupScreen}
            options={{ title: 'Yeni Grup Oluştur' }}
          />
          <Stack.Screen
            name="AlacakBorcIcmiScreen"
            component={AlacakBorcIcmiScreen}
            options={{ title: 'Alacak/Borç İçmi' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

AppRegistry.registerComponent('main', () => App);
