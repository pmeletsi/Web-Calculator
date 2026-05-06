# Story 3.4: Migrate Login form to Material UI

Status: ready-for-dev

## Story

As **a developer modernising the UI layer**,
I want **the Login page rebuilt with Material UI components per the wireframe**,
so that **the page matches the agreed visual design and the form is one less inline-style block to maintain**.

## Acceptance Criteria

1. `src/pages/Login.jsx` uses MUI components throughout — no inline `style={…}`, no plain HTML `<input>` / `<button>`.
2. The page matches the wireframe `docs/design/wireframes/login.md`:
   - `Card` containing the form, centered on the viewport (`Box` with `minHeight: 100vh` flex-centered).
   - `Typography` for the page heading.
   - `TextField` × 2 (Username + Password).
   - `Button variant="contained" type="submit" fullWidth`.
   - `Alert severity="error"` for the failure message (only when `error` state is set).
3. The hardcoded `users` array **remains** at the top of the file with a `// TODO(6.2): replace with API call` comment.
4. All existing functionality is preserved:
   - Login with `evi` / `1234` (or `nik` / `5678`) succeeds → caller's `onLogin` runs → navigates to `/`.
   - Wrong credentials show the MUI `Alert` with "Invalid credentials".
   - Username field auto-focuses on mount; both fields are `required`.
   - Submit on Enter still works (form `onSubmit`).
5. No browser console errors or MUI warnings; no leftover inline styles in this file.

## Tasks / Subtasks

- [ ] **Task 1 — Replace plain inputs with MUI `TextField`** (AC: 1, 2, 4)
  - [ ] Delete the two `<input>` elements; insert two `<TextField>`s with the props from **Dev Notes → Component map**.
  - [ ] Keep state management identical (`useState` per field).

- [ ] **Task 2 — Replace the submit button** (AC: 1, 2, 4)
  - [ ] Replace `<button className="btn control" type="submit">Login</button>` with a `<Button variant="contained" type="submit" fullWidth>`.

- [ ] **Task 3 — Replace the error message** (AC: 1, 2, 4)
  - [ ] Replace `<div style={{color:'red'}}>Invalid credentials!</div>` with `<Alert severity="error">Invalid credentials</Alert>`. Render only when `error` truthy.

- [ ] **Task 4 — Replace the form container** (AC: 1, 2)
  - [ ] Replace the inline-styled `<form className="login-form" style={…}>` with `<Box component="form" onSubmit={...}>` inside a `<Card sx={{ p: 4 }}>`.
  - [ ] Centre the card with an outer `<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`.

- [ ] **Task 5 — Confirm hardcoded users + TODO marker** (AC: 3)
  - [ ] At the top of the file, the `users` array stays exactly as today.
  - [ ] Add the comment `// TODO(6.2): replace with API call to POST /api/auth/login` directly above the array.

- [ ] **Task 6 — Verify behaviour and visuals** (AC: 4, 5)
  - [ ] Hard-refresh `npm run dev`.
  - [ ] Side-by-side check against wireframe 2.2.
  - [ ] Test: correct creds → navigates to `/`. Wrong creds → MUI Alert visible. Enter key submits.
  - [ ] Browser console: no warnings. Lighthouse pass on this single page is a **bonus**, not required.

- [ ] **Task 7 — Open the PR**
  - [ ] Branch: `feature/3.4-migrate-login-mui`

## Dev Notes

### Wireframe (target visual)

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│                  Web Calculator                      │ ← <Typography variant="h4" align="center">
│                                                      │
│    ┌────────────────────────────────────────────┐    │
│    │              Sign in to continue           │    │ ← <Card> wrapping the form
│    │                                            │    │
│    │    Username                                │    │
│    │    ┌────────────────────────────────────┐  │    │
│    │    │                                    │  │    │ ← <TextField label="Username" autoFocus required />
│    │    └────────────────────────────────────┘  │    │
│    │                                            │    │
│    │    Password                                │    │
│    │    ┌────────────────────────────────────┐  │    │
│    │    │ ••••                               │  │    │ ← <TextField label="Password" type="password" required />
│    │    └────────────────────────────────────┘  │    │
│    │                                            │    │
│    │    ┌────────────────────────────────────┐  │    │
│    │    │              Login                 │  │    │ ← <Button variant="contained" type="submit" fullWidth>
│    │    └────────────────────────────────────┘  │    │
│    │                                            │    │
│    │    ⚠  Invalid credentials                 │    │ ← <Alert severity="error"> (only when 401)
│    │                                            │    │
│    └────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Component map

| Element              | MUI component     | Key props                                                  |
|----------------------|-------------------|------------------------------------------------------------|
| Outer page container | `Box`             | `minHeight="100vh"`, flex-centered                          |
| Form wrapper         | `Card`            | `sx={{ p: 4, maxWidth: 400, width: '100%' }}`               |
| Form element         | `Box`             | `component="form" onSubmit={handleSubmit}`                  |
| Title                | `Typography`      | `variant="h4" align="center"`                               |
| Form heading         | `Typography`      | `variant="h6" gutterBottom`                                 |
| Username             | `TextField`       | `label="Username" autoFocus required fullWidth value={...} onChange={...}` |
| Password             | `TextField`       | `label="Password" type="password" required fullWidth value={...} onChange={...}` |
| Submit               | `Button`          | `variant="contained" type="submit" fullWidth sx={{ mt: 2 }}` |
| Error                | `Alert`           | `severity="error" sx={{ mt: 2 }}` — render only when `error` truthy |

### Reference shape

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert, Stack,
} from '@mui/material';

// TODO(6.2): replace with API call to POST /api/auth/login
const users = [
  { username: 'evi', password: '1234' },
  { username: 'nik', password: '5678' },
];

const Login = ({ onLogin }) => {
  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = users.find(u => u.username === inputUser && u.password === inputPass);
    if (found) {
      onLogin(inputUser);
      navigate('/', { replace: true });
    } else {
      setError('Invalid credentials');
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
          />
          <TextField
            label="Password" type="password" required fullWidth
            value={inputPass} onChange={(e) => setInputPass(e.target.value)}
          />

          <Button variant="contained" type="submit" fullWidth size="large">Login</Button>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Card>
    </Box>
  );
};

export default Login;
```

### Things to delete from the old file

- Top `import React` is unused (React 17+ JSX runtime). Drop unless ESLint says otherwise.
- The whole `<form className="login-form" onSubmit={...} style={...}>` block.
- All inline `style={…}` props.
- The literal "Invalid credentials!" string with the bang — Alert text reads cleaner without.

### Behavioural rules (must not change)

- `onLogin(inputUser)` is still called with the **typed** username (not the matched object's username). This is identical to today.
- After successful login, **navigate to `/`** (this was previously implicit because App.jsx re-rendered when `user` flipped — now we navigate explicitly because routes drive the view).
- Error state clears on next successful submit (current behaviour). Optional: clear `error` when either input changes — small UX polish, not required.

### Brownfield diff vs current `src/Login.jsx`

| Lines today           | Replaced with                                       |
|-----------------------|------------------------------------------------------|
| `<form … style={…}>`  | `<Stack component="form" …>` inside `<Card>` + `<Box>` |
| `<input type="text">` | `<TextField label="Username" required>`             |
| `<input type="password">` | `<TextField label="Password" type="password" required>` |
| `<button className="btn control">` | `<Button variant="contained">`             |
| `<div style={{color:'red'}}>` | `<Alert severity="error">`                  |

Total LOC delta: roughly the same, but no inline styles, no css classes. All visual behaviour driven by MUI theme.

### Out of scope

- API call wiring (Story 6.2).
- Removing the hardcoded `users` array (Story 6.2).
- Adding "remember me" or "forgot password" (not in PRD).
- Changing the route flow (already established in 3.2).

### Project Structure Notes

- **MODIFY:** `src/pages/Login.jsx` — full rewrite of the JSX, state logic untouched.
- **NEW:** none.
- **DELETE:** none.
- The legacy CSS in `index.css` for `.login-form` etc. becomes dead — leave for now; final cleanup in Story 3.6 once all three pages are migrated.

### References

- [Source: PRD §5 FR1, §6 NFR1](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.4 + Story 6.2 (downstream)](../planning-artifacts/epics.md)
- Existing implementation (pre-migration): [`src/Login.jsx`](../../src/Login.jsx) → `src/pages/Login.jsx` after Story 3.2
- MUI TextField: https://mui.com/material-ui/react-text-field/
- MUI Stack: https://mui.com/material-ui/react-stack/
- MUI Card: https://mui.com/material-ui/react-card/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
