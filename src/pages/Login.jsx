import { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { useAuth } from '../lib/AuthContext.jsx';

// TODO(6.2): replace with API call to POST /api/auth/login
const users = [
  { username: 'evi', password: '1234' },
  { username: 'nik', password: '5678' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const found = users.find(
      (u) => u.username === inputUser && u.password === inputPass
    );

    if (found) {
      login(`local-token-${inputUser}`, inputUser);
    } else {
      setError('Invalid credentials');
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
          />

          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
          />

          <Button variant="contained" type="submit" fullWidth size="large">
            Login
          </Button>

          {error && <Alert severity="error">Invalid credentials</Alert>}

        </Stack>
      </Card>
    </Box>
  );
};

export default LoginPage;
