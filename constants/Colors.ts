/**
 * Sade ve şık renk paleti - Ev Arkadaşım uygulaması için
 */

export const Colors = {
  // Ana renkler
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Ana mavi
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Nötr renkler
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Durum renkleri
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Özel renkler
  background: '#ffffff',
  surface: '#f8fafc',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    disabled: '#94a3b8',
  },
  
  // Gradient renkleri (sadece gerekli yerlerde)
  gradients: {
    primary: ['#0ea5e9', '#0284c7'],
    success: ['#22c55e', '#16a34a'],
    warning: ['#f59e0b', '#d97706'],
  },
};

// Tema desteği için eski yapıyı koruyalım
const tintColorLight = Colors.primary[500];
const tintColorDark = '#fff';

export const ThemeColors = {
  light: {
    text: Colors.text.primary,
    background: Colors.background,
    tint: tintColorLight,
    icon: Colors.text.secondary,
    tabIconDefault: Colors.text.secondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
