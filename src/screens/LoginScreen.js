import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Geçerli bir e-posta adresi girin').required('E-posta gerekli'),
    password: Yup.string().required('Şifre gerekli'),
  });

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      console.log('Giriş denemesi yapılıyor:', values.email);
      
      const response = await api.post('/Users/login', values);
      console.log('Sunucu yanıtı:', response.data);
      
      if (response.status === 200) {
        // Kullanıcı bilgisini AuthContext'e kaydet
        login(response.data);
        Alert.alert('Başarılı', 'Giriş başarılı!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Hata', response.data.message || 'Giriş bilgileri hatalı');
      }
    } catch (error) {
      console.log('Giriş hatası:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Giriş yapılırken bir hata oluştu.';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve sunucunun çalıştığından emin olun.';
      } else if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'E-posta veya şifre hatalı.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Bağlantı Hatası', errorMessage);
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

            <Button title="Giriş Yap" onPress={handleSubmit} disabled={loading} />
          </View>
        )}
      </Formik>

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
  container: { 
    flex: 1, 
    padding: 16, 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  label: { 
    fontSize: 18, 
    marginBottom: 8 
  },
  input: { 
    height: 40, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    marginBottom: 16, 
    paddingHorizontal: 8, 
    borderRadius: 5 
  },
  loadingContainer: { 
    alignItems: 'center', 
    marginBottom: 16 
  },
  errorText: { 
    color: 'red', 
    fontSize: 14, 
    marginBottom: 8 
  },
  footer: { 
    marginTop: 20, 
    alignItems: 'center' 
  },
  linkText: { 
    color: 'blue', 
    fontSize: 16, 
    marginTop: 10, 
    textDecorationLine: 'underline' 
  },
});
