import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as defaultTheme, darkTheme, amoledTheme } from './theme';

const ThemeContext = createContext({ theme: defaultTheme, setThemeKey: () => {} });

export const ThemeProvider = ({ children, value }) => {
  const [themeKey, setThemeKey] = useState('light');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved) setThemeKey(saved);
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem('app_theme', themeKey).catch(() => {}); }, [themeKey]);

  const themeObj = useMemo(() => {
    if (value) return value;
    if (themeKey === 'dark') return darkTheme;
    if (themeKey === 'amoled') return amoledTheme;
    return defaultTheme;
  }, [themeKey, value]);

  // Colors mutate ETME. Renkler yalnızca theme üzerinden tüketilir.

  const ctx = useMemo(() => ({ theme: themeObj, setThemeKey }), [themeObj]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);


