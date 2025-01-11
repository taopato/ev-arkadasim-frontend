import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator initialRouteName={user ? "HomeScreen" : "Login"}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt Ol' }} />
        </>
      ) : (
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Ana Menü' }} />
      )}
    </Stack.Navigator>
  );
};

export default AuthStack;
