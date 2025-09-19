// src/shared/ui/Card.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const Card = ({ style, children }) => {
  const { theme } = useTheme();
  const dynamic = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.neutral?.[200],
  };
  return <View style={[styles.card, dynamic, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
});

export default Card;
