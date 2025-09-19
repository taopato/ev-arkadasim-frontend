// src/shared/ui/Button.js
import React from 'react';
import { TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const Button = ({ title, onPress, loading, style, textStyle, disabled }) => {
  const isDisabled = loading || disabled;
  const { theme } = useTheme();
  const bg = isDisabled
    ? theme.colors.neutral?.[300]
    : theme.colors.primary?.[600];
  const fg = theme.colors.text?.onPrimary;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, { backgroundColor: bg }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.txt, { color: fg }, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  txt: { fontWeight: '700' },
});
