import React from 'react';
import { TextInput as RNTextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../../constants/Colors';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = Colors.text.disabled,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  style,
  textStyle,
  disabled = false,
  onFocus,
  onBlur,
}) => {
  return (
    <RNTextInput
      style={[
        styles.input,
        disabled && styles.disabled,
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={!disabled}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.neutral[100],
  },
});
