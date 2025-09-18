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
import GirisYap from './src/screens/GirisYap';
import KayitOl from './src/screens/KayitOl';
import SifremiUnuttum from './src/screens/SifremiUnuttum';
import AnaSayfa from './src/screens/AnaSayfa';
import EvArkadasiEkle from './src/screens/EvArkadasiEkle';
import TumHarcamalar from './src/screens/TumHarcamalar';
import BorcAlacakOzeti from './src/screens/BorcAlacakOzeti';
import HarcamaOnayi from './src/screens/HarcamaOnayi';
import KayitOlEkran from './src/screens/KayitOl';
import SifreSifirla from './src/screens/SifreSifirla';
import Dogrulama from './src/screens/Dogrulama';
import EvUyeleri from './src/screens/EvUyeleri';
import Ozet from './src/screens/Ozet';
import HarcamaEkle from './src/screens/HarcamaEkle';
import GrupListesi from './src/screens/GrupListesi';
import YeniEvGrubu from './src/screens/YeniEvGrubu';

// **Yeni**: "Borçlarım" ve "Alacaklarım" ekranları
import Borclar from './src/screens/Borclar';
import AlacaklarListesi from './src/screens/AlacaklarListesi';
import Alacaklarim from './src/screens/Alacaklarim';

// **Yeni**: Harcama Yönetimi ekranları
import HarcamaDetayi from './src/screens/HarcamaDetayi';

// **Yeni**: Davet Sistemi ekranları
import DavetEt from './src/screens/DavetEt';
import DavetiyeKabul from './src/screens/DavetiyeKabul';
import OdemeOnayi from './src/screens/OdemeOnayi';
import OdemeEkle from './src/screens/OdemeEkle';
import EvHarcamaOzeti from './src/screens/EvHarcamaOzeti';
import Faturalar from './src/screens/Faturalar';
import FaturaEkle from './src/screens/FaturaEkle';
import FaturaOlustur from './src/screens/FaturaOlustur';
import BekleyenKatkilar from './src/screens/BekleyenKatkilar';
import KisiDetayi from './src/screens/KisiDetayi';
// Eksik kayıtlar: HomeScreen düğmeleri için
import GunlukHarcamalar from './src/screens/GunlukHarcamalar';
import Odemeler from './src/screens/Odemeler';
import BekleyenOdemeler from './src/screens/BekleyenOdemeler';
// Ek akışlar
import EvGrubuArkadaslarim from './src/screens/EvGrubuArkadaslarim';
import GiderListesi from './src/screens/GiderListesi';
// NewRecurringCharge ekranını AddBillScreen ile birleştiriyoruz
import FaturaListesi from './src/screens/FaturaListesi';
import FaturaDetayi from './src/screens/FaturaDetayi';
import HarcamaEkleEkran from './src/screens/HarcamaEkle';
import AlacakBorcIcmi from './src/screens/AlacakBorcIcmi';
import DuzenliGiderEkle from './src/screens/DuzenliGiderEkle';
import Ayarlar from './src/screens/Ayarlar';
import DefterDetayi from './src/screens/DefterDetayi';
import PlanliOdemeler from './src/screens/PlanliOdemeler';
import HarcamaListesi from './src/screens/HarcamaListesi';
import HarcamaOzeti from './src/screens/HarcamaOzeti';

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
              component={GirisYap}
              options={{ title: 'Giriş Yap' }}
            />

            <Stack.Screen
              name="Register"
              component={KayitOl}
              options={{ title: 'Kayıt Ol' }}
            />
            <Stack.Screen
              name="ForgotPasswordScreen"
              component={SifremiUnuttum}
              options={{ title: 'Şifremi Unuttum' }}
            />
            {/* Yeni: Şifre Sıfırla */}
            <Stack.Screen
              name="ResetPasswordScreen"
              component={SifreSifirla}
              options={{ title: 'Şifreyi Sıfırla' }}
            />

            {/* Kayıt ve Doğrulama Ekranları */}
            <Stack.Screen
              name="SignupScreen"
              component={KayitOlEkran}
              options={{ title: 'Kayıt Ol' }}
            />
            <Stack.Screen
              name="VerificationScreen"
              component={Dogrulama}
              options={{ title: 'Doğrulama' }}
            />

            {/* Ana Menü ve Alt Ekranlar */}
            <Stack.Screen name="Home" component={AnaSayfa} options={{ title: 'Ana Menü' }} />
            {/* Eksik ekran kayıtları eklendi */}
            <Stack.Screen name="ExpensesScreen" component={GunlukHarcamalar} options={{ title: 'Günlük Harcamalar' }} />
            <Stack.Screen name="PaymentsScreen" component={Odemeler} options={{ title: 'Ödemeler' }} />
            <Stack.Screen name="PendingPaymentsScreen" component={BekleyenOdemeler} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen name="Odemeler" component={Odemeler} options={{ title: 'Ödemeler' }} />
            <Stack.Screen name="BekleyenOdemeler" component={BekleyenOdemeler} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen name="Harcamalar" component={GunlukHarcamalar} options={{ title: 'Günlük Harcamalar' }} />
            <Stack.Screen name="NewRecurringChargeScreen" component={DuzenliGiderEkle} options={{ title: 'Düzenli Gider Ekle' }} />
            <Stack.Screen name="ExpenseDetail" component={HarcamaDetayi} options={{ title: 'Harcama Detayı' }} />
            <Stack.Screen name="Ayarlar" component={Ayarlar} options={{ title: 'Ayarlar' }} />
            <Stack.Screen
              name="AddHousemate"
              component={EvArkadasiEkle}
              options={{ title: '👤 Ev Arkadaşı Ekle' }}
            />
            <Stack.Screen
              name="HarcamaListesi"
              component={TumHarcamalar}
              options={{ title: '📋 Tüm Harcamalar' }}
            />
            <Stack.Screen
              name="ExpenseListScreen"
              component={TumHarcamalar}
              options={{ title: '📋 Tüm Harcamalar' }}
            />
            <Stack.Screen name="DebtSummaryScreen" component={BorcAlacakOzeti} options={{ title: 'Borç Özeti' }} />
            <Stack.Screen
              name="ExpenseApproval"
              component={HarcamaOnayi}
              options={{ title: '✅ Harcama Onayı' }}
            />

            {/* Ev Arkadaşlarım / Borçlarım / Alacaklarım */}
            <Stack.Screen
              name="GrupListesi"
              component={GrupListesi}
              options={{ title: '🏘️ Ev Gruplarım' }}
            />
            <Stack.Screen name="EvUyeleri" component={EvUyeleri} options={{ title: 'Ev Arkadaşları' }} />

            {/* **Yeni**: "Borçlarım" ve "Alacaklarım" ekranları */}
            <Stack.Screen name="Borclar" component={Borclar} options={{ title: 'Borçlarım' }} />
            <Stack.Screen name="AlacaklarListesi" component={AlacaklarListesi} options={{ title: 'Alacaklarım' }} />
            <Stack.Screen name="Alacaklarim" component={Alacaklarim} options={{ title: 'Alacaklarım' }} />

            {/* **Yeni**: Harcama Yönetimi */}
            <Stack.Screen name="HarcamaDetayi" component={HarcamaDetayi} options={{ title: 'Harcama Detayı' }} />

            {/* Harcama akışı */}
            <Stack.Screen name="HarcamaEkle" component={HarcamaEkle} options={{ title: 'Harcama Ekle' }} />

            {/* Detay */}
            <Stack.Screen name="Ozet" component={Ozet} options={{ title: 'Alacak/Borç Özeti' }} />

            {/* Grup yönetimi */}
            <Stack.Screen
              name="YeniEvGrubu"
              component={YeniEvGrubu}
              options={{ title: '🏘️ Yeni Grup Oluştur' }}
            />
            <Stack.Screen
              name="EvGrubuArkadaslarim"
              component={EvGrubuArkadaslarim}
              options={{ title: 'Ev Arkadaşlarım' }}
            />

            {/* **Yeni**: Davet Sistemi */}
            <Stack.Screen name="DavetEt" component={DavetEt} options={{ title: 'Arkadaş Davet Et' }} />
            <Stack.Screen name="DavetiyeKabul" component={DavetiyeKabul} options={{ title: 'Davet Kabul Et' }} />
            <Stack.Screen name="OdemeOnayi" component={OdemeOnayi} options={{ title: 'Bekleyen Ödemeler' }} />
            <Stack.Screen name="Faturalar" component={Faturalar} options={{ title: 'Planlı Giderler' }} />
            <Stack.Screen name="FaturaEkle" component={FaturaEkle} options={{ title: 'Yeni Fatura' }} />
            <Stack.Screen name="FaturaListesi" component={FaturaListesi} options={{ title: 'Faturalar' }} />
            <Stack.Screen name="FaturaDetayi" component={FaturaDetayi} options={{ title: 'Fatura Detayı' }} />
            <Stack.Screen name="BillDetail" component={FaturaDetayi} options={{ title: 'Fatura Detayı' }} />
            <Stack.Screen name="FaturaOlustur" component={FaturaOlustur} options={{ title: 'Fatura Oluştur' }} />
            <Stack.Screen
              name="BekleyenKatkilar"
              component={BekleyenKatkilar}
              options={{ title: 'Bekleyen Katkılar' }}
            />
            <Stack.Screen name="OdemeEkle" component={OdemeEkle} options={{ title: 'Ödeme Yap' }} />
            <Stack.Screen name="GiderListesi" component={GiderListesi} options={{ title: 'Gider Dönemleri' }} />
            <Stack.Screen
              name="DuzenliGiderEkle"
              component={DuzenliGiderEkle}
              options={{ title: 'Düzenli Gider Ekle' }}
              initialParams={{ isEditing: false }}
            />
            {/* Uyum için: bazı yerlerde bu adla çağrılıyor */}
            <Stack.Screen
              name="DuzenliGiderEkleScreen"
              component={DuzenliGiderEkle}
              options={{ title: 'Düzenli Gider Ekle' }}
            />
            <Stack.Screen name="HarcamaEkleEkran" component={HarcamaEkleEkran} options={{ title: 'Harcama Ekle' }} />
            <Stack.Screen name="AlacakBorcIcmi" component={AlacakBorcIcmi} options={{ title: 'Borç/Alacak Detayı' }} />
            <Stack.Screen name="EvHarcamaOzeti" component={EvHarcamaOzeti} options={{ title: 'Harcama Özeti' }} />
            <Stack.Screen
              name="KisiDetayi"
              component={KisiDetayi}
              options={{ title: '👥 İkili Borç/Alacak Detayı' }}
            />
            
            {/* Eksik ekran kayıtları */}
            <Stack.Screen name="LedgerDetail" component={DefterDetayi} options={{ title: 'Borç/Alacak Detayları' }} />
            <Stack.Screen name="BillsOverviewScreen" component={Faturalar} options={{ title: 'Faturalar' }} />
            <Stack.Screen name="UtilityBillCreate" component={DuzenliGiderEkle} options={{ title: 'Düzenli Gider Ekle' }} />
            <Stack.Screen name="PendingContributions" component={BekleyenKatkilar} options={{ title: 'Bekleyen Onaylar' }} />
            
            {/* Yeni tasarlanan ekranlar */}
            <Stack.Screen name="PlanliOdemeler" component={PlanliOdemeler} options={{ title: 'Planlı Ödemeler' }} />
            <Stack.Screen name="TumHarcamalar" component={TumHarcamalar} options={{ title: 'Tüm Harcamalar' }} />
            <Stack.Screen name="HarcamaOzeti" component={HarcamaOzeti} options={{ title: 'Harcama Özeti' }} />
          </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// AppRegistry.registerComponent('main', () => App); // Expo managed workflow için gerekli değil
