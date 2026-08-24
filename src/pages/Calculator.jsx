import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../lib/AuthContext.jsx';
import { getExpressionError } from '../lib/expressionValidator';
import apiClient from '../lib/apiClient';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';


const Calculator = () => {
  const { logout, isAdmin } = useAuth();
  const [input, setInput] = useState('');
  const [result, setResult] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [justCalculated, setJustCalculated] = useState(false);

  useEffect(() => {
    if (getExpressionError(input)) return undefined;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const { data } = await apiClient.post(
          '/api/calculations/preview',
          { expression: input },
          { signal: controller.signal },
        );
        setResult(data.result.toString());
      } catch (err) {
        if (err.code !== 'ERR_CANCELED' && err.response?.status !== 400 && err.response?.status !== 401) {
          setResult('0');
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [input]);

  const handleClick = (value) => {
    const isOperator = /^[+\-*/]$/.test(value);
    const nextInput = justCalculated
      ? (isOperator ? result + value : value)
      : input + value;

    setInput(nextInput);
    setJustCalculated(false);

    if (justCalculated && !isOperator) {
      setResult('0');
    } else if (!justCalculated && getExpressionError(nextInput)) {
      setResult('0');
    }
  };
  const handleClear = () => {
    setInput('');
    setResult('0');
    setJustCalculated(false);
  };
  const handleDelete = () => {
    const nextInput = justCalculated ? '' : input.slice(0, -1);
    setInput(nextInput);
    setJustCalculated(false);
    if (getExpressionError(nextInput)) setResult('0');
  };

  const handleCalculate = async () => {
    const validationError = getExpressionError(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    const expression = input;

    try {
      const { data } = await apiClient.post('/api/calculations', { expression });
      setResult(data.result.toString());
      setJustCalculated(true);
    } catch (err) {
      if (err.response?.status === 400) {
        const msg = err.response?.data?.message ?? 'Invalid expression';
        setError(msg);
        setInput(expression);
      } else if (err.response?.status === 401) {
        // Axios interceptor handles cleanup and redirect.
      } else {
        setError('Could not calculate. Try again.');
        setInput(expression);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const keys = [
    { label: 'C', onClick: handleClear, variant: 'outlined', color: 'warning' },
    { label: '\u232B', onClick: handleDelete, variant: 'outlined', color: 'warning' },
    { parentheses: true },
    { label: '\u00F7', onClick: () => handleClick('/'), variant: 'outlined', color: 'secondary' },

    { label: '7', onClick: () => handleClick('7'), variant: 'outlined' },
    { label: '8', onClick: () => handleClick('8'), variant: 'outlined' },
    { label: '9', onClick: () => handleClick('9'), variant: 'outlined' },
    { label: '\u00D7', onClick: () => handleClick('*'), variant: 'outlined', color: 'secondary' },

    { label: '4', onClick: () => handleClick('4'), variant: 'outlined' },
    { label: '5', onClick: () => handleClick('5'), variant: 'outlined' },
    { label: '6', onClick: () => handleClick('6'), variant: 'outlined' },
    { label: '\u2212', onClick: () => handleClick('-'), variant: 'outlined', color: 'secondary' },

    { label: '1', onClick: () => handleClick('1'), variant: 'outlined' },
    { label: '2', onClick: () => handleClick('2'), variant: 'outlined' },
    { label: '3', onClick: () => handleClick('3'), variant: 'outlined' },
    { label: '+', onClick: () => handleClick('+'), variant: 'outlined', color: 'secondary' },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Web Calculator
          </Typography>

          <Button color="inherit" component={Link} to="/history">
            History
          </Button>

                  {isAdmin && (
                      <>
                          <Button color="inherit" component={Link} to="/admin/users">
                              Admin Users
                          </Button>

                          <Button color="inherit" component={Link} to="/admin/history">
                              Admin History
                          </Button>
                      </>
                  )}

          <ThemeToggleButton />

          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 3 }}>
        <Paper
          sx={{
            p: 2,
            mb: 2,
            textAlign: 'right',
            minHeight: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ width: '100%', minHeight: 20, overflowWrap: 'anywhere' }}
          >
            {input || '\u00A0'}
          </Typography>
          <Typography variant="h4" sx={{ width: '100%', overflowWrap: 'anywhere' }}>
            {result}
          </Typography>
        </Paper>

        <Grid container spacing={1}>
          {keys.map((k, i) => (
            <Grid size={3} key={i}>
              {k?.parentheses ? (
                <Grid container spacing={0.5}>
                  <Grid size={6}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleClick('(')}
                      sx={{ minWidth: 0, py: 1 }}
                    >
                      (
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleClick(')')}
                      sx={{ minWidth: 0, py: 1 }}
                    >
                      )
                    </Button>
                  </Grid>
                </Grid>
              ) : k && (
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
                          disabled={submitting}
                          onClick={handleCalculate}
                      >
                          {submitting ? <CircularProgress size={20} color="inherit" /> : '='}
                      </Button>
          </Grid>
        </Grid>

      </Container>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Calculator;
