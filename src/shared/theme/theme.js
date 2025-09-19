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
    neutral: {
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      900: '#171717',
    },
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    error: { 500: '#ef4444' },
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
    neutral: {
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      900: '#0b1220',
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
    neutral: {
      100: '#111111',
      200: '#1a1a1a',
      300: '#262626',
      900: '#000000',
    },
  },
};


