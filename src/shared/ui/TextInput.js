// src/shared/ui/TextInput.js
import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const TextInput = ({ style, ...props }) => {
  const { theme } = useTheme();
  const dynamic = {
    borderColor: theme.colors.neutral?.[300],
    backgroundColor: theme.colors.background,
    color: theme.colors.text?.primary,
  };
  const placeholderColor = theme.colors.text?.disabled;
  return <RNTextInput style={[styles.input, dynamic, style]} placeholderTextColor={placeholderColor} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

export default TextInput;
