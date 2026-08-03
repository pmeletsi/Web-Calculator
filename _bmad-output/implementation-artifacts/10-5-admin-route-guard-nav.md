# Story 10.5: `AuthContext` role + `<RequireAdmin>` guard + `/admin` routes

Status: ready-for-dev

## Story

As **a frontend user (Admin or not)**,
I want **the app to know my role and route Admins to admin-only pages while keeping non-admins out**,
so that **Stories 10.6/10.7 have a route and a nav entry to attach their pages to**.

## Acceptance Criteria

1. `useAuth()` exposes a `role` value (`"User"` | `"Admin"` | `null` when logged out), decoded from the JWT payload (no extra network call).
2. `useAuth()` exposes a convenience `isAdmin` boolean derived from `role === "Admin"`.
3. A `<RequireAdmin>` wrapper component exists alongside the existing `<RequireAuth>` (Story 3.2/6.1): renders `children` if `isAdmin`, otherwise redirects to `/` (logged-in non-admins) or `/login` (logged out).
4. Router config (`src/main.jsx` or wherever routes are declared) gains `/admin/users` and `/admin/history` placeholder routes wrapped in `<RequireAdmin>`, initially rendering a plain `<div>Coming soon</div>` each — replaced with real pages in 10.6/10.7.
5. The app's nav/header shows an "Admin" entry (or two: "Users", "History") **only when `isAdmin` is true**; non-admins never see it, including via direct URL navigation attempts (AC 3 covers that).
6. Logging out clears `role` the same way it already clears `user`/`token`.

## Tasks / Subtasks

- [ ] **Task 1 — Decode the JWT role in `AuthContext`** (AC: 1, 2, 6)
  - [ ] Add a small helper (`decodeJwtRole(token)`) — a minimal base64url payload decode, **no new dependency**; `jwt-decode` may be added instead if already present in `package.json`, otherwise hand-roll the ~10 lines to avoid a new package for one field.
  - [ ] Derive `role` from the stored token on mount and after `login()`; clear it in `logout()`.
- [ ] **Task 2 — `<RequireAdmin>`** (AC: 3)
  - [ ] New component, sibling to the existing route-guard component from Story 3.2/6.1.
- [ ] **Task 3 — Routes** (AC: 4)
  - [ ] Register `/admin/users` and `/admin/history` in the router, each wrapped `<RequireAdmin><... /></RequireAdmin>`.
- [ ] **Task 4 — Nav entry** (AC: 5)
  - [ ] Conditionally render the Admin nav item(s) based on `isAdmin`.
- [ ] **Task 5 — Manual verification** (AC: all)
  - [ ] Log in as `nik` (User role) → no Admin nav entry visible; navigating directly to `/admin/users` redirects to `/`.
  - [ ] Log in as `admin` → Admin nav entry visible; `/admin/users` and `/admin/history` render the placeholder.
  - [ ] Log out → visiting `/admin/users` redirects to `/login`.
- [ ] **Task 6 — Open the PR**
  - [ ] Branch: `feature/10.5-admin-route-guard-nav`

## Dev Notes

### Minimal JWT payload decode (no library)

```js
// src/lib/AuthContext.jsx — add this helper above the AuthProvider component
function decodeJwtRole(token) {
  if (!token) return null;
  try {
    // Base64url decode the payload segment (index 1)
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    // .NET maps ClaimTypes.Role to a long URI key by default; check both
    return (
      payload.role ??
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      null
    );
  } catch {
    return null;
  }
}
```

> **How to find the actual claim key:** after Story 10.2 is merged, log in as `admin`, copy the JWT from DevTools → Application → Local Storage → `token`, and paste it into the browser console: `JSON.parse(atob(token.split('.')[1]))`. Check which key holds the role value. If Story 10.2 set `RoleClaimType = ClaimTypes.Role` in `Program.cs` **and** `JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap` maps it (it does by default for `ClaimTypes.Role` → `"role"`), you'll see a short `"role"` key. The fallback in the helper handles both cases.

### `AuthContext.jsx` — full updated file

`src/lib/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

function decodeJwtRole(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return (
      payload.role ??
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      null
    );
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => localStorage.getItem(USER_KEY));
  const [role,  setRole]  = useState(() => decodeJwtRole(localStorage.getItem(TOKEN_KEY)));

  const login = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY,  newUser);
    setToken(newToken);
    setUser(newUser);
    setRole(decodeJwtRole(newToken));   // ← new
    navigate('/', { replace: true });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setRole(null);                      // ← new
    navigate('/login', { replace: true });
  };

  const isAdmin = role === 'Admin';    // ← new

  return (
    <AuthContext.Provider value={{ user, token, role, isAdmin, login, logout }}>
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

### `<RequireAdmin>` component

Place this alongside wherever `RequireAuth` lives. If `RequireAuth` is inline in `src/App.jsx`, add `RequireAdmin` there too. If it's a separate file, follow the same pattern:

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/"      replace />;
  return children;
}
```

### Router additions (in `src/App.jsx` or wherever routes are defined)

```jsx
import { RequireAdmin } from './lib/RequireAdmin'; // or wherever you placed it

// Inside the <Routes> block — add after the existing routes:
<Route path="/admin/users" element={
  <RequireAdmin>
    <div>Coming soon — Admin Users</div>  {/* replaced in 10.6 */}
  </RequireAdmin>
} />
<Route path="/admin/history" element={
  <RequireAdmin>
    <div>Coming soon — Admin History</div>  {/* replaced in 10.7 */}
  </RequireAdmin>
} />
```

### Conditional nav entry

Inside the navigation/header component, wherever the existing nav links live:

```jsx
const { user, isAdmin, logout } = useAuth();

// ... existing nav items ...

{isAdmin && (
  <>
    <Button component={Link} to="/admin/users"   color="inherit">Admin: Users</Button>
    <Button component={Link} to="/admin/history" color="inherit">Admin: History</Button>
  </>
)}
```

Use two separate nav entries (Users, History) rather than a single "Admin" dropdown — keeps the nav flat and simple (PRD §11 C6: no unnecessary UI complexity).

### Out of scope

- The real `AdminUsers`/`AdminHistory` page content — Stories 10.6/10.7 (placeholders only here).
- Automated tests — Story 10.8.

### Project Structure Notes

- **MODIFY:** `src/lib/AuthContext.jsx` (add `role`/`isAdmin`, decode helper, clear on logout)
- **NEW/MODIFY:** route-guard file (wherever `RequireAuth` lives, e.g. `src/App.jsx` or `src/lib/`) — add `RequireAdmin`
- **MODIFY:** router config (`src/main.jsx` or `src/App.jsx`) — add `/admin/users`, `/admin/history` placeholder routes
- **MODIFY:** nav/header component — conditional Admin entry

### References

- [Source: PRD §5 FR7, FR9; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.5](../planning-artifacts/epics.md)
- [Source: Story 3.2 — original route guard pattern](./3-2-add-react-router.md)
- [Source: Story 6.1 — `AuthContext` this extends](./6-1-auth-context-axios.md)
- [Source: Story 10.2 — JWT `role` claim this decodes](./10-2-jwt-role-authorization.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
