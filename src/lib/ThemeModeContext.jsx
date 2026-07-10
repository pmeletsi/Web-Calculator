import { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createAppTheme from '../theme';

const THEME_MODE_KEY = 'theme_mode';
const ThemeModeContext = createContext(null);

const getInitialMode = () => {
  const saved = localStorage.getItem(THEME_MODE_KEY);
  return saved === 'dark' ? 'dark' : 'light';
};

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleMode = () => {
    setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_MODE_KEY, next);
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggleMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error('useThemeMode must be used inside AppThemeProvider');
  return context;
};
