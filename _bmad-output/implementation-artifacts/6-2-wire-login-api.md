# Story 6.2: Wire Login to `POST /api/auth/login`; remove hardcoded users

Status: ready-for-dev

## Story

As **an authorized user**,
I want **the Login form to authenticate me against the backend instead of a hardcoded array in the frontend**,
so that **PRD FR1 is genuinely satisfied — credentials live in the database (seeded by Story 4.4) and the FE no longer ships passwords in source**.

## Acceptance Criteria

1. `src/pages/Login.jsx` calls `apiClient.post('/api/auth/login', { username, password })` on submit.
2. On `200 { token, username }` → calls `useAuth().login(token, username)` (which navigates to `/`).
3. On `401` → renders `<Alert severity="error">Invalid credentials</Alert>`. On other errors → "Could not log in. Try again."
4. While the request is in flight, the submit button is **disabled** and shows `<CircularProgress size={20} color="inherit" />`.
5. **The hardcoded `users` array is deleted** from `Login.jsx`. The `// TODO(6.2)` comment is gone.
6. `Login.jsx` no longer accepts an `onLogin` prop (uses `useAuth().login` directly).
7. `grep "users\s*=\s*\[" src/pages/Login.jsx` returns 0 hits.

## Tasks / Subtasks

- [ ] **Task 1 — Rewrite the submit handler** (AC: 1, 2, 3, 4)
  - [ ] Replace the existing `handleSubmit` per **Dev Notes → New Login.jsx**.
  - [ ] Add `submitting` state for the in-flight UX.

- [ ] **Task 2 — Delete the hardcoded users** (AC: 5, 7)
  - [ ] Remove the entire `const users = [...]` block from the top of the file.
  - [ ] Remove the `// TODO(6.2): replace with API call` comment.
  - [ ] Remove the `users.find(...)` lookup logic (no longer needed).

- [ ] **Task 3 — Remove the `onLogin` prop** (AC: 6)
  - [ ] `Login.jsx` no longer takes any props.
  - [ ] Use `const { login } = useAuth();` at the top of the component.

- [ ] **Task 4 — Verify end-to-end** (AC: all)
  - [ ] Backend running (`dotnet run --project backend/WebCalculator.Api`).
  - [ ] FE running (`npm run dev`).
  - [ ] Login with `evi` / `1234` → success → lands on `/`.
  - [ ] Token visible in DevTools → Application → Local Storage → `token` (a long JWT string).
  - [ ] Login with `evi` / `wrongpass` → MUI Alert "Invalid credentials".
  - [ ] Login with `unknown` / `anything` → same generic Alert (no user-enumeration leak).
  - [ ] Stop the backend, try login → "Could not log in. Try again." (network error path).

- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/6.2-wire-login-api`

## Dev Notes

### New `Login.jsx`

`src/pages/Login.jsx`:

```jsx
import { useState } from 'react';
import {
  Box, Card, TextField, Button, Typography, Alert, Stack, CircularProgress,
} from '@mui/material';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';

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
      login(data.token, data.username);  // navigates to / itself
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" align="center">Web Calculator</Typography>
          <Typography variant="h6" align="center" color="text.secondary">Sign in to continue</Typography>

          <TextField
            label="Username" autoFocus required fullWidth
            value={inputUser} onChange={(e) => setInputUser(e.target.value)}
            disabled={submitting}
          />
          <TextField
            label="Password" type="password" required fullWidth
            value={inputPass} onChange={(e) => setInputPass(e.target.value)}
            disabled={submitting}
          />

          <Button
            variant="contained" type="submit" fullWidth size="large"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Login'}
          </Button>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Card>
    </Box>
  );
};

export default Login;
```

### Diff vs. the post-3.4 file

| Before (3.4) | After (this story) |
|---|---|
| `const users = [{ username: 'evi', password: '1234' }, ...]` | **deleted** |
| `// TODO(6.2): replace with API call` | **deleted** |
| `const Login = ({ onLogin }) => { ... }` | `const Login = () => { ... }` |
| `const navigate = useNavigate();` | **deleted** (AuthContext.login navigates) |
| `users.find(...)` then `if (found) onLogin(...)` then `navigate('/', ...)` | `apiClient.post(...)` then `login(data.token, data.username)` |
| inline `setError('Invalid credentials')` on local mismatch | `setError(...)` based on HTTP status |
| no submitting state | `submitting` state + disabled inputs + spinner button |

### Why username matters in the response

The backend response includes `username`. We pass it to `login(token, username)` so `AuthContext` can store it (used for display in AppBars / future personalisation). The username comes from the backend so it's the **canonical** form (matches `Users.Username` exactly, including case if applicable).

### Why disable inputs while submitting

Prevents the user from changing the username/password between request and response (would cause confusion if a stale credential 401-fails). Tiny UX touch.

### Out of scope

- "Remember me" / persistent session — already persisted via `localStorage` from 6.1.
- Password reset — not in PRD §5.
- Rate limiting on the form — backend concern, out of brief.

### Project Structure Notes

- **MODIFY:** `src/pages/Login.jsx` (rewrite handler + remove hardcoded users + drop onLogin prop)
- **NEW:** none.
- **DELETE:** none (the `users` array is removed, but the file stays).

### References

- [Source: PRD §5 FR1; §9 API Surface (POST /api/auth/login)](../planning-artifacts/prd.md)
- [Source: epics.md Story 6.2 + upstream 5.2 + 6.1](../planning-artifacts/epics.md)
- [Source: Story 5.2 — backend login contract](./5-2-auth-login-jwt.md)
- [Source: Story 6.1 — AuthContext](./6-1-auth-context-axios.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
