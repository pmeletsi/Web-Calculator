import { createTheme } from '@mui/material/styles';

const createAppTheme = (mode = 'light') => createTheme({
  palette: {
    mode,
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: {
    fontFamily: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
    h4: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
});

export default createAppTheme;
