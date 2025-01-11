import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#007bff',
  danger: '#dc3545',
  success: '#28a745',
  light: '#f8f9fa',
};

export const globalStyles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, marginBottom: 16, paddingHorizontal: 8 },
});
