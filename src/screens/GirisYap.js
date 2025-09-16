// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { CommonStyles, ColorThemes } from '../shared/ui/CommonStyles';

const GirisYap = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const raw = response?.data || {};
      const data = raw?.data ?? raw ?? {};

      const getDeep = (obj, predicate) => {
        const stack = [obj];
        while (stack.length) {
          const cur = stack.pop();
          if (!cur || typeof cur !== 'object') continue;
          if (predicate(cur)) return cur;
          for (const key of Object.keys(cur)) {
            const val = cur[key];
            if (val && typeof val === 'object') stack.push(val);
          }
        }
        return null;
      };

      const findValueByKeyList = (obj, keys) => {
        const lowered = keys.map(k => k.toLowerCase());
        const node = getDeep(obj, n => Object.keys(n).some(k => lowered.includes(k.toLowerCase())));
        if (!node) return undefined;
        for (const k of Object.keys(node)) {
          if (lowered.includes(k.toLowerCase())) return node[k];
        }
        return undefined;
      };

      const token = findValueByKeyList(data, ['token', 'accessToken', 'jwt', 'jwtToken']);
      let user = findValueByKeyList(data, ['user', 'userDto', 'account', 'profile', 'userInfo']);

      // Eğer user alanı yok ama kimlik ipuçları varsa minimal bir user oluştur
      if (!user) {
        const userId = findValueByKeyList(data, ['userId', 'id']);
        const fullName = findValueByKeyList(data, ['fullName', 'name']);
        const emailFromApi = findValueByKeyList(data, ['email', 'mail']);
        if (userId || fullName || emailFromApi) {
          user = { id: userId ?? 0, fullName: fullName ?? email, email: emailFromApi ?? email };
        }
      }

      const successRaw = findValueByKeyList(raw, ['success', 'isSuccess', 'Succeeded', 'ok']) ?? data?.success;
      const success = typeof successRaw === 'string'
        ? successRaw.toLowerCase() === 'true'
        : (typeof successRaw === 'boolean' ? successRaw : Boolean(token && user));

      console.log('Login normalized =>', { success, hasToken: !!token, hasUser: !!user });

      if (success && token && user) {
        await login(user, token);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }

      const serverMessage = raw?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      const looksLikeSuccessText = typeof serverMessage === 'string' && serverMessage.toLowerCase().includes('başarılı');
      const title = (success || looksLikeSuccessText) ? 'Bilgi' : 'Giriş başarısız';
      Alert.alert(title, serverMessage);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Bilinmeyen hata';
      Alert.alert('Giriş başarısız', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={CommonStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={CommonStyles.content}>
          <Text style={CommonStyles.title}>Giriş Yap</Text>
          <View style={CommonStyles.card}>
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.buttonText}>Giriş Yap</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
              <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: {
    backgroundColor: ColorThemes.primary.background,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { color: '#0ea5e9', marginTop: 12, textAlign: 'center' },
});

export default GirisYap;
