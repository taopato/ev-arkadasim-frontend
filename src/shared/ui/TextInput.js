// src/shared/ui/TextInput.js
import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const TextInput = ({ style, ...props }) => {
  return <RNTextInput style={[styles.input, style]} placeholderTextColor={Colors.text.disabled} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
    fontSize: 16,
    color: Colors.text.primary,
  },
});

export default TextInput;
