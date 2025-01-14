import 'react-native-gesture-handler'; // React Navigation için gereklidir
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddHousemateScreen from './src/screens/AddHousemateScreen';
import ExpenseListScreen from './src/screens/ExpenseListScreen'; // Harcama Listesi
import AddExpenseScreen from './src/screens/AddExpenseScreen'; // Harcama Ekleme
import DebtSummaryScreen from './src/screens/DebtSummaryScreen';
import ExpenseApprovalScreen from './src/screens/ExpenseApprovalScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerificationScreen from './src/screens/VerificationScreen';



const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Şifremi Unuttum' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Menü' }} />
        <Stack.Screen name="AddHousemate" component={AddHousemateScreen} options={{ title: 'Ev Arkadaşı Ekle' }} />
        <Stack.Screen name="HarcamaListesi" component={ExpenseListScreen} options={{ title: 'Harcama Listesi' }} />
        <Stack.Screen name="HarcamaEkle" component={AddExpenseScreen} options={{ title: 'Harcama Ekle' }} />
        <Stack.Screen name="DebtSummary" component={DebtSummaryScreen} options={{ title: 'Borç Özeti' }} />
        <Stack.Screen name="ExpenseApproval" component={ExpenseApprovalScreen} options={{ title: 'Harcama Onayı' }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Doğrulama' }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

AppRegistry.registerComponent('main', () => App);
