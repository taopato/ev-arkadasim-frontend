import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { TextInput } from '../shared/ui/TextInput';
import { Colors } from '../../constants/Colors';
import Toast from '../components/Toast';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // Animasyonlar
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Sayfa açılış animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email: email.trim(), password });
      const envelope = response?.data;
      // Olası sarmalayıcılar: data, result, value
      const payload = envelope?.data ?? envelope?.result ?? envelope?.value ?? envelope;

      // Derin arama yardımcıları: token ve user alanlarını iç içe yanıtlarda yakala
      const isObject = (val) => val !== null && typeof val === 'object';
      const findDeepByKeys = (obj, keys) => {
        if (!isObject(obj)) return null;
        const stack = [obj];
        while (stack.length) {
          const current = stack.pop();
          if (!isObject(current)) continue;
          for (const k of Object.keys(current)) {
            if (keys.includes(k) && current[k]) {
              return current[k];
            }
            const child = current[k];
            if (isObject(child)) stack.push(child);
            if (Array.isArray(child)) {
              for (const item of child) if (isObject(item)) stack.push(item);
            }
          }
        }
        return null;
      };

      // Düz objeden kullanıcı oluştur (backend user alanını sarmalamadıysa)
      const buildUserFromFlatObject = (obj) => {
        if (!isObject(obj)) return null;
        const id = obj.id ?? obj.userId ?? obj.Id ?? obj.UserId;
        const fullName = obj.fullName ?? obj.name ?? obj.FullName ?? obj.Name;
        const email = obj.email ?? obj.Email ?? obj.username ?? obj.userName ?? obj.UserName;
        if (id != null && (fullName || email)) {
          return { id, fullName: fullName || '', email: email || '' };
        }
        return null;
      };

      const tokenKeys = [
        'token', 'Token', 'accessToken', 'access_token', 'access-token', 'jwt', 'jwtToken', 'idToken',
        'authToken', 'bearerToken', 'tokenString', 'Authorization', 'authorization'
      ];
      const userKeys = ['user', 'User', 'userInfo', 'profile', 'userDto', 'userDTO', 'userModel', 'userData'];

      let extractedToken =
        payload?.token ?? payload?.Token ?? envelope?.token ?? envelope?.Token ??
        payload?.accessToken ?? envelope?.accessToken ??
        findDeepByKeys(payload, tokenKeys) ?? findDeepByKeys(envelope, tokenKeys);
      let extractedUser =
        payload?.user ?? payload?.User ?? envelope?.user ?? envelope?.User ??
        findDeepByKeys(payload, userKeys) ?? findDeepByKeys(envelope, userKeys);

      // user anahtarı yoksa, kök objeden türetmeyi dene
      if (!extractedUser) {
        extractedUser = buildUserFromFlatObject(payload) ?? buildUserFromFlatObject(envelope);
      }

      if (extractedToken && extractedUser) {
        await login(extractedUser, extractedToken);
        showToast('Giriş başarılı!', 'success');
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 1500);
      } else if (envelope?.success === false) {
        showToast(envelope?.message || 'Giriş başarısız', 'error');
      } else {
        console.warn('Giriş yanıtı beklenen formatta değil:', envelope);
        showToast('Giriş başarısız', 'error');
      }
    } catch (error) {
      console.error('Login hatası:', error);
      
      // Backend'den gelen hata mesajını al
      let errorMessage = 'Giriş başarısız';
      
      if (error.response?.status === 401) {
        errorMessage = 'E-posta veya şifre hatalı';
      } else 
      if (error.response?.status === 500) {
        // Backend'den gelen detaylı hata mesajı
        const serverError = error.response.data;
        if (serverError && typeof serverError === 'string') {
          // System.UnauthorizedAccessException mesajını temizle
          if (serverError.includes('E-posta veya şifre hatalı')) {
            errorMessage = 'E-posta veya şifre hatalı';
          } else {
            errorMessage = serverError;
          }
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ev Arkadaşım</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta adresinizi girin"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Şifrenizi girin"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

                         <View style={styles.buttonContainer}>
               <Button
                 title="Giriş Yap"
                 onPress={handleLogin}
                 loading={loading}
                 style={styles.loginButton}
               />
             </View>
          </Card>

          {/* Navigation Links */}
          <View style={styles.navigationLinks}>
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('ForgotPasswordScreen')}
            >
              Şifremi Unuttum
            </Text>
            
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('SignupScreen')}
            >
              Hesap Oluştur
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  loginButton: {
    marginBottom: 8,
  },
  testButton: {
    marginBottom: 8,
  },
  navigationLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary[500],
    fontWeight: '500',
  },
});

export default LoginScreen;
