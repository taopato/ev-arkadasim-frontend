export const theme = {
  colors: {
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8',
      onPrimary: '#ffffff',
    },
    primary: {
      500: '#0ea5e9',
      600: '#0284c7',
    },
    info: { 500: '#3b82f6', 600: '#2563eb' },
    neutral: {
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      900: '#171717',
    },
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    error: { 500: '#ef4444' },
    pastel: {
      blue:   { bg: '#dbeafe', fg: '#1e3a8a' },
      green:  { bg: '#dcfce7', fg: '#065f46' },
      purple: { bg: '#ede9fe', fg: '#4c1d95' },
      orange: { bg: '#ffedd5', fg: '#7c2d12' },
      pink:   { bg: '#ffe4e6', fg: '#881337' },
    },
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
  },
  spacing: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
};


// Dark theme
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#0b1220',
    surface: '#0f172a',
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      disabled: '#64748b',
      onPrimary: '#ffffff',
    },
    primary: {
      500: '#38bdf8',
      600: '#0ea5e9',
    },
    info: { 500: '#60a5fa', 600: '#3b82f6' },
    neutral: {
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      900: '#0b1220',
    },
    pastel: {
      blue:   { bg: '#1e3a8a26', fg: '#e2e8f0' },
      green:  { bg: '#065f4626', fg: '#e2e8f0' },
      purple: { bg: '#4c1d9526', fg: '#e2e8f0' },
      orange: { bg: '#7c2d1226', fg: '#e2e8f0' },
      pink:   { bg: '#88133726', fg: '#e2e8f0' },
    },
  },
};

// AMOLED (gece) theme
export const amoledTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    surface: '#000000',
    text: {
      primary: '#f1f5f9',
      secondary: '#a1a1aa',
      disabled: '#52525b',
      onPrimary: '#ffffff',
    },
    primary: {
      500: '#22d3ee',
      600: '#06b6d4',
    },
    info: { 500: '#60a5fa', 600: '#3b82f6' },
    neutral: {
      100: '#111111',
      200: '#1a1a1a',
      300: '#262626',
      900: '#000000',
    },
    pastel: {
      blue:   { bg: '#1e3a8a26', fg: '#f1f5f9' },
      green:  { bg: '#065f4626', fg: '#f1f5f9' },
      purple: { bg: '#4c1d9526', fg: '#f1f5f9' },
      orange: { bg: '#7c2d1226', fg: '#f1f5f9' },
      pink:   { bg: '#88133726', fg: '#f1f5f9' },
    },
  },
};


