import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Geçerli bir e-posta adresi girin').required('E-posta gerekli'),
    password: Yup.string().required('Şifre gerekli'),
  });

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/Users/login', values);
      if (response.status === 200) {
        Alert.alert('Başarılı', 'Giriş başarılı!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Hata', response.data.message || 'Giriş bilgileri hatalı');
      }
    } catch (error) {
      console.log('error',error);
      console.error(error.response ? error.response.data : error.message);
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Giriş yapılıyor...</Text>
        </View>
      )}
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            {/* Email Input */}
            <Text style={styles.label}>E-posta:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              placeholder="E-posta adresinizi girin"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && touched.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            {/* Password Input */}
            <Text style={styles.label}>Şifre:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              placeholder="Şifrenizi girin"
              secureTextEntry
            />
            {errors.password && touched.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            {/* Login Button */}
            <Button title="Giriş Yap" onPress={handleSubmit} disabled={loading} />
          </View>
        )}
      </Formik>

      {/* Register and Forgot Password Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Kayıt Ol</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>Şifremi Unuttum</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 18, marginBottom: 8 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 16, paddingHorizontal: 8, borderRadius: 5 },
  loadingContainer: { alignItems: 'center', marginBottom: 16 },
  errorText: { color: 'red', fontSize: 14, marginBottom: 8 },
  footer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: 'blue', fontSize: 16, marginTop: 10, textDecorationLine: 'underline' },
});
