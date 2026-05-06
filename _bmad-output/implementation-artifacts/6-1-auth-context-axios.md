# Story 6.1: AuthContext + Axios JWT interceptor + real route guard + Logout cleanup

Status: ready-for-dev

## Story

As **the team**,
I want **a real `AuthContext` that holds the JWT, an Axios interceptor that attaches `Authorization: Bearer …` to every request and handles 401 globally, and a `RequireAuth` route guard that reads from the context**,
so that **Stories 6.2 / 6.3 / 6.4 can call the backend with one line each — and the placeholder `localStorage["user"]` auth from Story 3.2 is replaced by something real**.

## Acceptance Criteria

1. `src/lib/AuthContext.jsx` exists with:
   - `AuthProvider` component that owns `{ user, token }` state, persists both to `localStorage["token"]` + `localStorage["user"]`, and exposes `login(token, username)` + `logout()`.
   - `useAuth()` hook returning the context value.
   - `login()` navigates to `/`; `logout()` fire-and-forget POSTs `/api/auth/logout`, cleans local state, and navigates to `/login`.
2. `src/main.jsx` wraps `<App />` with `<AuthProvider>` **inside** `<BrowserRouter>` (the order matters — `AuthProvider` uses `useNavigate`).
3. `src/lib/apiClient.js` (created in Story 3.3) gains two interceptors:
   - **Request:** reads `localStorage["token"]` and adds `Authorization: Bearer …` if present.
   - **Response:** on 401 → clears `localStorage`, hard-redirects to `/login` (unless already there).
4. `src/App.jsx` is simplified:
   - Removes the local `user` state, `handleLogin`, `handleLogout` (now in `AuthContext`).
   - `<RequireAuth>` reads `user` from `useAuth()` instead of `localStorage` directly.
5. The `Logout` buttons in `pages/Calculator.jsx` and `pages/History.jsx` call `useAuth().logout()` (no `onLogout` prop chain).
6. End-to-end smoke (with Stories 4.x + 5.x backend running): log in via the existing flow → token visible in `localStorage["token"]` → opening any protected route while token is removed redirects to `/login`.
7. **No `localStorage["user"]` reads or writes remain outside `AuthContext`** (grep the codebase).

## Tasks / Subtasks

- [ ] **Task 1 — Create `AuthContext`** (AC: 1)
  - [ ] `src/lib/AuthContext.jsx` per **Dev Notes → `AuthContext.jsx` content**.

- [ ] **Task 2 — Wrap `<App />` with `<AuthProvider>`** (AC: 2)
  - [ ] Edit `src/main.jsx` per **Dev Notes → `main.jsx` after this story**.
  - [ ] Order: `<ThemeProvider>` → `<BrowserRouter>` → `<AuthProvider>` → `<App />`.

- [ ] **Task 3 — Add Axios interceptors** (AC: 3)
  - [ ] Edit `src/lib/apiClient.js` per **Dev Notes → `apiClient.js` after this story**.

- [ ] **Task 4 — Simplify `App.jsx`** (AC: 4)
  - [ ] Remove the `user` state + `handleLogin` + `handleLogout` (kept temporarily by 3.2's pattern).
  - [ ] `<RequireAuth>` becomes:
    ```jsx
    function RequireAuth({ children }) {
      const { user } = useAuth();
      if (!user) return <Navigate to="/login" replace />;
      return children;
    }
    ```
  - [ ] `LoginPage` no longer receives `onLogin` (Story 6.2 makes it use `useAuth`).
  - [ ] Calculator/History pages no longer receive `onLogout` — they call `useAuth().logout()`.
  - [ ] **Keep** the `history` state + `setHistory` + `clearHistory` for now (Story 6.4 removes them).

- [ ] **Task 5 — Update `Logout` buttons in pages** (AC: 5)
  - [ ] In `pages/Calculator.jsx`, replace `onClick={onLogout}` with `onClick={logout}` from `const { logout } = useAuth();`.
  - [ ] Same edit in `pages/History.jsx`.

- [ ] **Task 6 — Verify** (AC: 6, 7)
  - [ ] `npm run dev` and (in another shell) `dotnet run --project backend/WebCalculator.Api`.
  - [ ] Login still works against the existing flow (will switch to API in Story 6.2).
  - [ ] Token absent? Hit `/` → redirected to `/login`.
  - [ ] Manually wipe `localStorage` in DevTools → next API call (after 6.2/3/4) → 401 → redirect to `/login`.
  - [ ] `grep -r "localStorage.getItem('user')" src/` — should return 0 hits outside `AuthContext.jsx`. Same for `setItem` and `removeItem`.

- [ ] **Task 7 — Open the PR**
  - [ ] Branch: `feature/6.1-auth-context-axios`

## Dev Notes

### `AuthContext.jsx` content

`src/lib/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from './apiClient';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => localStorage.getItem(USER_KEY));

  const login = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, newUser);
    setToken(newToken);
    setUser(newUser);
    navigate('/', { replace: true });
  };

  const logout = () => {
    // Fire-and-forget — server is stateless (Story 5.2), the call is for API symmetry only.
    apiClient.post('/api/auth/logout').catch(() => {});

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
```

### `main.jsx` after this story

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App.jsx';
import theme from './theme.js';
import { AuthProvider } from './lib/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
```

> **Why this nesting?** `AuthProvider` uses `useNavigate()` which only works **inside** `<BrowserRouter>`. So: Router first, then Provider, then App.

### `apiClient.js` after this story

```jsx
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach bearer token from localStorage (single source of truth).
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: on 401, clear local auth state and hard-redirect to /login.
// We use window.location (not useNavigate) because interceptors run outside React's tree.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

> **Why `window.location.href` and not `useNavigate`?** The interceptor isn't a React component, so hooks can't run there. A hard redirect is the simplest cross-cutting solution; the side effect is a full page reload that wipes any in-memory state — which is exactly what we want when auth is invalidated. PRD §11 C6: keep it boring.

### `App.jsx` after this story

```jsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import CalculatorPage from './pages/Calculator.jsx';
import HistoryPage from './pages/History.jsx';
import { useAuth } from './lib/AuthContext.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const App = () => {
  // TODO(6.4): drop the local history state + setHistory + clearHistory entirely.
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calc_history') || '[]'); }
    catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('calc_history', JSON.stringify(history)); } catch {}
  }, [history]);
  const clearHistory = () => setHistory([]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <RequireAuth>
          <CalculatorPage history={history} setHistory={setHistory} />
        </RequireAuth>
      }/>
      <Route path="/history" element={
        <RequireAuth>
          <HistoryPage history={history} clearHistory={clearHistory} />
        </RequireAuth>
      }/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
```

> **Why keep the `history` state?** Story 6.4 is the one that finally drops it. Until then, Calculator (Story 6.3) needs `setHistory` to update the local cache for the History page (which still reads from local state). The `// TODO(6.4)` marker is the breadcrumb.

### Cleanup grep checklist (Task 6)

After this story, the **only** file with `localStorage.getItem('token')` / `localStorage.setItem('token', …)` / `localStorage.removeItem('token')` should be `src/lib/AuthContext.jsx` and `src/lib/apiClient.js` (interceptor reads it). Same for `'user'` — only `AuthContext` and `apiClient` 401 handler.

`localStorage.getItem('calc_history')` still has 1 reference in `App.jsx` (removed in 6.4).

### What this story does NOT do

- The Login form still uses the hardcoded `users` array (Story 6.2 swaps to API).
- The Calculator still calls `eval` (Story 6.3 swaps to API).
- The History page still reads `localStorage` (Story 6.4 swaps to API).

This story is **plumbing only** — once it lands, the next three stories each become a focused per-feature swap.

### Out of scope

- Refresh token rotation (PRD Q1).
- Decoding JWT to get user info (we already store username in `localStorage`).
- Single-tab vs multi-tab logout sync (could use `storage` events; not in PRD).

### Project Structure Notes

- **NEW:** `src/lib/AuthContext.jsx`
- **MODIFY:** `src/lib/apiClient.js` (add 2 interceptors)
- **MODIFY:** `src/main.jsx` (wrap with `<AuthProvider>` inside `<BrowserRouter>`)
- **MODIFY:** `src/App.jsx` (remove user state + handleLogin/Logout; `<RequireAuth>` uses `useAuth`)
- **MODIFY:** `src/pages/Calculator.jsx` (Logout button uses `useAuth().logout`)
- **MODIFY:** `src/pages/History.jsx` (Logout button uses `useAuth().logout`)

### References

- [Source: PRD §5 FR1, FR6; §9 API Surface; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 6.1 + downstream 6.2/6.3/6.4](../planning-artifacts/epics.md)
- React Context: https://react.dev/reference/react/createContext
- Axios interceptors: https://axios-http.com/docs/interceptors
- React Router `useNavigate`: https://reactrouter.com/en/main/hooks/use-navigate

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
