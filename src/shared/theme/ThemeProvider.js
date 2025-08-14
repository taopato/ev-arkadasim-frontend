import React, { createContext, useContext } from 'react';
import { theme as defaultTheme } from './theme';

const ThemeContext = createContext(defaultTheme);

export const ThemeProvider = ({ children, value }) => {
  return (
    <ThemeContext.Provider value={value || defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


