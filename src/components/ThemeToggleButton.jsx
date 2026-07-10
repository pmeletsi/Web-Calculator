import { Button } from '@mui/material';
import { useThemeMode } from '../lib/ThemeModeContext.jsx';

const ThemeToggleButton = () => {
  const { mode, toggleMode } = useThemeMode();
  const nextMode = mode === 'dark' ? 'Light' : 'Dark';

  return (
    <Button color="inherit" onClick={toggleMode}>
      {nextMode} Mode
    </Button>
  );
};

export default ThemeToggleButton;
