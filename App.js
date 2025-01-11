import 'react-native-gesture-handler'; // React Navigation için gereklidir
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddHousemateScreen from './src/screens/AddHousemateScreen';
import ExpenseListScreen from './src/screens/ExpenseListScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import DebtSummaryScreen from './src/screens/DebtSummaryScreen';
import ExpenseApprovalScreen from './src/screens/ExpenseApprovalScreen';

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
        <Stack.Screen name="ExpenseList" component={ExpenseListScreen} options={{ title: 'Harcama Listesi' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Harcama Ekle' }} />
        <Stack.Screen name="DebtSummary" component={DebtSummaryScreen} options={{ title: 'Borç Özeti' }} />
        <Stack.Screen name="ExpenseApproval" component={ExpenseApprovalScreen} options={{ title: 'Harcama Onayı' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

AppRegistry.registerComponent('main', () => App);
