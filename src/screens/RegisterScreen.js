import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { authApi } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: kod doğrulama, 3: tam kayıt
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const EmailSchema = Yup.object().shape({
    email: Yup.string().email('Geçerli bir e-posta adresi girin').required('E-posta gerekli'),
  });

  const CodeSchema = Yup.object().shape({
    code: Yup.string().length(6, 'Kod 6 haneli olmalıdır').required('Doğrulama kodu gerekli'),
  });

  const RegisterSchema = Yup.object().shape({
    fullName: Yup.string().min(2, 'Ad soyad en az 2 karakter olmalıdır').required('Ad soyad gerekli'),
    password: Yup.string().min(6, 'Şifre en az 6 karakter olmalıdır').required('Şifre gerekli'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Şifreler eşleşmiyor').required('Şifre tekrarı gerekli'),
  });

  const handleSendCode = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.sendVerificationCode(values.email);
      
      if (response.data && response.data.success) {
        setEmail(values.email);
        setStep(2);
        Alert.alert('Başarılı', 'Doğrulama kodu e-posta adresinize gönderildi.');
      }
    } catch (error) {
      console.error('Kod gönderme hatası:', error);
      Alert.alert('Hata', 'Kod gönderilemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.verifyCodeForReset(email, values.code);
      
      if (response.data && response.data.success) {
        setVerificationCode(values.code);
        setStep(3);
        Alert.alert('Başarılı', 'Kod doğrulandı. Kayıt işlemini tamamlayın.');
      }
    } catch (error) {
      console.error('Kod doğrulama hatası:', error);
      Alert.alert('Hata', 'Kod doğrulanamadı: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.verifyCodeAndRegister(
        email, 
        verificationCode, 
        values.fullName, 
        values.password
      );
      
      if (response.data && response.data.success) {
        Alert.alert(
          'Başarılı', 
          'Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.',
          [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.error('Kayıt tamamlama hatası:', error);
      Alert.alert('Hata', 'Kayıt tamamlanamadı: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Adım 1: E-posta Adresinizi Girin</Text>
      <Formik
        initialValues={{ email: '' }}
        validationSchema={EmailSchema}
        onSubmit={handleSendCode}
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

            <Button title="Doğrulama Kodu Gönder" onPress={handleSubmit} disabled={loading} />
          </View>
        )}
      </Formik>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Adım 2: Doğrulama Kodunu Girin</Text>
      <Text style={styles.infoText}>{email} adresine gönderilen 6 haneli kodu girin</Text>
      
      <Formik
        initialValues={{ code: '' }}
        validationSchema={CodeSchema}
        onSubmit={handleVerifyCode}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <Text style={styles.label}>Doğrulama Kodu:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('code')}
              onBlur={handleBlur('code')}
              value={values.code}
              placeholder="6 haneli kodu girin"
              keyboardType="numeric"
              maxLength={6}
            />
            {errors.code && touched.code ? <Text style={styles.errorText}>{errors.code}</Text> : null}

            <Button title="Kodu Doğrula" onPress={handleSubmit} disabled={loading} />
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
              <Text style={styles.linkText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Adım 3: Bilgilerinizi Tamamlayın</Text>
      
      <Formik
        initialValues={{ fullName: '', password: '', confirmPassword: '' }}
        validationSchema={RegisterSchema}
        onSubmit={handleCompleteRegistration}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <Text style={styles.label}>Ad Soyad:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('fullName')}
              onBlur={handleBlur('fullName')}
              value={values.fullName}
              placeholder="Ad ve soyadınızı girin"
            />
            {errors.fullName && touched.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

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

            <Text style={styles.label}>Şifre Tekrarı:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
              placeholder="Şifrenizi tekrar girin"
              secureTextEntry
            />
            {errors.confirmPassword && touched.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

            <Button title="Kayıt Ol" onPress={handleSubmit} disabled={loading} />
            <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
              <Text style={styles.linkText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>İşlem yapılıyor...</Text>
        </View>
      )}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş yapın</Text>
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
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
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
  backButton: {
    marginTop: 10,
    alignItems: 'center'
  }
});
