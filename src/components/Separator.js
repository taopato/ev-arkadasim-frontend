// src/components/Separator.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const Separator = ({ inset = 0 }) => <View style={[styles.sep, { marginLeft: inset }]} />;

const styles = StyleSheet.create({
  sep: { height: 1, backgroundColor: Colors.neutral[200], marginVertical: 8 },
});

export default Separator;
