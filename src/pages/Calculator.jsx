import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Button
} from '@mui/material';

const isValidExpression = (expr) => {
  if (!expr || expr.trim() === '') return false;
  if (/[+\-*/.]$/.test(expr)) return false;
  if (/([+\-*/]{2,})/.test(expr.replace(/--/g, ''))) return false;
  if (/\.\./.test(expr)) return false;
  if (/[^0-9+\-*/.\s]/.test(expr)) return false;
  if (/\/0(?![0-9.])/.test(expr)) return false;
  return true;
};

const Calculator = ({ user, history, setHistory, onLogout }) => {
  const [input, setInput] = useState('');

  const handleClick = (value) => setInput((prev) => prev + value);
  const handleClear = () => setInput('');
  const handleDelete = () => setInput((prev) => prev.slice(0, -1));

  const handleCalculate = () => {
    if (!isValidExpression(input)) {
      setInput('Invalid');
      return;
    }

    try {
      const expression = input;

      // TODO(6.3): replace with backend POST /api/calculations
      const result = eval(expression).toString();

      setInput(result);

      setHistory((prev) => [
        {
          expression,
          result,
          createdAt: new Date().toISOString(),
          username: user,
        },
        ...prev,
      ]);
    } catch {
      setInput('Error');
    }
  };

  const keys = [
    { label: 'C', onClick: handleClear, variant: 'outlined', color: 'warning' },
    { label: '⌫', onClick: handleDelete, variant: 'outlined', color: 'warning' },
    null,
    { label: '÷', onClick: () => handleClick('/'), variant: 'outlined', color: 'secondary' },

    { label: '7', onClick: () => handleClick('7'), variant: 'outlined' },
    { label: '8', onClick: () => handleClick('8'), variant: 'outlined' },
    { label: '9', onClick: () => handleClick('9'), variant: 'outlined' },
    { label: '×', onClick: () => handleClick('*'), variant: 'outlined', color: 'secondary' },

    { label: '4', onClick: () => handleClick('4'), variant: 'outlined' },
    { label: '5', onClick: () => handleClick('5'), variant: 'outlined' },
    { label: '6', onClick: () => handleClick('6'), variant: 'outlined' },
    { label: '−', onClick: () => handleClick('-'), variant: 'outlined', color: 'secondary' },

    { label: '1', onClick: () => handleClick('1'), variant: 'outlined' },
    { label: '2', onClick: () => handleClick('2'), variant: 'outlined' },
    { label: '3', onClick: () => handleClick('3'), variant: 'outlined' },
    { label: '+', onClick: () => handleClick('+'), variant: 'outlined', color: 'secondary' },
  ];

  return (
    <>
      {/* ✅ AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Web Calculator
          </Typography>

          <Button color="inherit" component={Link} to="/history">
            History
          </Button>

          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Page Container */}
      <Container maxWidth="sm" sx={{ mt: 3 }}>

        {/* Display */}
        <Paper
          sx={{
            p: 2,
            mb: 2,
            textAlign: 'right',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <Typography variant="h4">
            {input || '0'}
          </Typography>
        </Paper>

        {/* Keypad */}
        <Grid container spacing={1}>
          {keys.map((k, i) => (
            <Grid size={3} key={i}>
              {k && (
                <Button
                  fullWidth
                  size="large"
                  variant={k.variant}
                  color={k.color}
                  onClick={k.onClick}
                >
                  {k.label}
                </Button>
              )}
            </Grid>
          ))}

          <Grid size={6}>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              onClick={() => handleClick('0')}
            >
              0
            </Button>
          </Grid>

          <Grid size={3}>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              onClick={() => handleClick('.')}
            >
              .
            </Button>
          </Grid>

          <Grid size={3}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="primary"
              disabled={!isValidExpression(input)}
              onClick={handleCalculate}
            >
              =
            </Button>
          </Grid>
        </Grid>

      </Container>
    </>
  );
};

export default Calculator;