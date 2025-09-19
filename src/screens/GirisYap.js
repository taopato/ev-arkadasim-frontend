// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useCommonStyles } from '../shared/ui/CommonStyles';
import { useTheme } from '../shared/theme/ThemeProvider';
import { TextInput as ThemedTextInput } from '../shared/ui/TextInput';
import { Button as ThemedButton } from '../shared/ui/Button';

const GirisYap = ({ navigation }) => {
  const { login } = useAuth();
  const { theme } = useTheme();
  const CommonStyles = useCommonStyles();
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
      style={[CommonStyles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[CommonStyles.content, { backgroundColor: theme.colors.background }]}>
          <Text style={[CommonStyles.title, { color: theme.colors.text.primary }]}>Giriş Yap</Text>
          <View style={[CommonStyles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.neutral?.[200] }]}>
            <ThemedTextInput
              style={{ marginBottom: 12 }}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <ThemedTextInput
              style={{ marginBottom: 12 }}
              placeholder="Şifre"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <ThemedButton title="Giriş Yap" onPress={handleLogin} loading={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
              <Text style={[styles.link, { color: theme.colors.primary?.[600] }]}>Hesabın yok mu? Kayıt ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  link: { marginTop: 12, textAlign: 'center' },
});

export default GirisYap;
