// src/shared/ui/Button.js
import React from 'react';
import { TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const Button = ({ title, onPress, loading, style, textStyle, disabled }) => {
  const isDisabled = loading || disabled;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.txt, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: Colors.neutral[300] },
  txt: { color: '#fff', fontWeight: '700' },
});

export default Button;
