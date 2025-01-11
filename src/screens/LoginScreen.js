import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const LoginSchema = Yup.object().shape({
    username: Yup.string().required('Kullanıcı adı gerekli'),
    password: Yup.string().required('Şifre gerekli'),
  });

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/login', values);
      console.log(response);
      if (response.status === 200) {
        Alert.alert('Başarılı', 'Giriş başarılı!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Hata', response.data.message || 'Giriş bilgileri hatalı');
      }
    } catch (error) {
      console.error(error);
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
      <Formik initialValues={{ username: '', password: '' }} validationSchema={LoginSchema} onSubmit={handleLogin}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <Text style={styles.label}>Kullanıcı Adı:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              value={values.username}
              placeholder="Kullanıcı adınızı girin"
              autoCapitalize="none"
            />
            {errors.username && touched.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

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
});
