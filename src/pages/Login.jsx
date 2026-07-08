import { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await apiClient.post('/api/auth/login', {
        username: inputUser,
        password: inputPass,
      });
      login(data.token, data.username);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError('Could not log in. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Typography variant="h4" align="center" sx={{ mb: 3 }}>
        Web Calculator
      </Typography>

      <Card sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>

          <Typography variant="h6" align="center" color="text.secondary">
            Sign in to continue
          </Typography>

          <TextField
            label="Username"
            autoFocus
            required
            fullWidth
            value={inputUser}
            onChange={(e) => setInputUser(e.target.value)}
            disabled={submitting}
          />

          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
            disabled={submitting}
          />

          <Button variant="contained" type="submit" fullWidth size="large" disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Login'}
          </Button>

           {error && <Alert severity="error">{error}</Alert>}

        </Stack>
      </Card>
    </Box>
  );
};

export default Login;
