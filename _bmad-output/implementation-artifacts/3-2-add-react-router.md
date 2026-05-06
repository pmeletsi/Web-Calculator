# Story 3.2: Add React Router with `/login`, `/`, `/history` routes

Status: ready-for-dev

## Story

As **the team**,
I want **the app to use real routes instead of conditional render**,
so that **each screen is independently addressable, the URL reflects state, and Stories 3.4 / 3.5 / 3.6 can each ship one page-file at a time without touching shared logic**.

## Acceptance Criteria

1. `react-router-dom@^7` is installed.
2. Three routes exist: `/login` → Login, `/` → Calculator, `/history` → History.
3. `App.jsx` becomes a thin **router shell** holding the cross-page state (`user`, `history`) and rendering `<Routes>`. The page-level UI logic moves into `src/pages/Login.jsx`, `src/pages/Calculator.jsx`, `src/pages/History.jsx`.
4. A placeholder `<RequireAuth>` wrapper redirects to `/login` if `localStorage["user"]` is empty. (Real `AuthContext` lands in Story 6.1 — placeholder is intentional.)
5. **All existing functionality is preserved**, end-to-end:
   - Login with `evi` / `1234` succeeds → lands on `/`.
   - Calculator: enter expression, `=` evaluates, result shown, history grows.
   - History: shows past calculations (top 8) with username and timestamp.
   - Logout: clears state and returns to `/login`.
6. The "click history item to reuse expression" feature is **dropped** (not in PRD scope, simplifies routing — confirmed by the History wireframe inline in Story 3.6 which does not include it).
7. `npm run build` and `npm run dev` both succeed; no console errors or React Router warnings.

## Tasks / Subtasks

- [ ] **Task 1 — Install React Router** (AC: 1)
  - [ ] `npm install react-router-dom@^7`

- [ ] **Task 2 — Wrap the app in `<BrowserRouter>`** (AC: 2)
  - [ ] In `src/main.jsx`, import `BrowserRouter` from `react-router-dom` and wrap `<App />` with it (inside `<ThemeProvider>`).

- [ ] **Task 3 — Create `src/pages/Login.jsx`** (AC: 3)
  - [ ] Move the body of the existing `src/Login.jsx` here.
  - [ ] Accept an `onLogin` callback as a prop (same signature as today).
  - [ ] After successful login, call `navigate('/', { replace: true })` where `navigate = useNavigate()`.
  - [ ] Delete the old `src/Login.jsx` (or re-export from there for one PR transition; preferred: delete in this PR).

- [ ] **Task 4 — Create `src/pages/Calculator.jsx`** (AC: 3, 5)
  - [ ] Extract the calculator UI block (the `!showHistory ? (...) : ...` true branch) from `App.jsx`.
  - [ ] Accept `history`, `setHistory`, `user` as props.
  - [ ] Owns local state: `input` (the running expression).
  - [ ] Owns handlers: `handleClick`, `handleClear`, `handleDelete`, `handleCalculate`.
  - [ ] Header: simple flex bar for now (MUI `AppBar` arrives in Story 3.5) with `History` link (`<Link to="/history">`) and Logout button.
  - [ ] **Do NOT** alter the calculator's button labels or eval logic — that's Story 3.5.

- [ ] **Task 5 — Create `src/pages/History.jsx`** (AC: 3, 5, 6)
  - [ ] Extract the history view block (the `:` branch) from `App.jsx`.
  - [ ] Accept `history`, `clearHistory` as props.
  - [ ] Header: link back to Calculator (`<Link to="/">`) + Logout.
  - [ ] **Drop** the per-row click-to-reuse handler (AC 6).
  - [ ] **Do NOT** restructure to MUI Table — that's Story 3.6.

- [ ] **Task 6 — Refactor `src/App.jsx` to a router shell** (AC: 3)
  - [ ] Keep top-level state: `user`, `history` (still localStorage-backed).
  - [ ] Render `<Routes>` with the three routes per **Dev Notes → `App.jsx` shape**.
  - [ ] Pass props to each page.

- [ ] **Task 7 — Add `<RequireAuth>` wrapper** (AC: 4)
  - [ ] Implement per **Dev Notes → `RequireAuth` snippet**.
  - [ ] Wrap `/` and `/history` routes with it.

- [ ] **Task 8 — Verify all flows end-to-end** (AC: 5, 7)
  - [ ] Cold visit `/` while logged out → redirected to `/login`.
  - [ ] Login → land on `/`.
  - [ ] Submit a calculation → result appears, history grows (verify via `/history`).
  - [ ] Logout → redirected to `/login`; `localStorage["user"]` cleared.
  - [ ] Direct URL `/history` while logged in → renders.
  - [ ] Browser back/forward navigation works.

- [ ] **Task 9 — Open the PR**
  - [ ] Branch: `feature/3.2-add-react-router`

## Dev Notes

### `App.jsx` shape after this story

```jsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import CalculatorPage from './pages/Calculator.jsx';
import HistoryPage from './pages/History.jsx';

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const App = () => {
  const [user, setUser] = useState(() => localStorage.getItem('user') || null);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem('user', username);
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // TODO(6.4): replace with API-backed history hook
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
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route
        path="/"
        element={
          <RequireAuth user={user}>
            <CalculatorPage user={user} history={history} setHistory={setHistory} onLogout={handleLogout} />
          </RequireAuth>
        }
      />
      <Route
        path="/history"
        element={
          <RequireAuth user={user}>
            <HistoryPage history={history} clearHistory={clearHistory} onLogout={handleLogout} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
```

### `RequireAuth` snippet

Embedded above. Note: this reads `user` via prop (passed from App's state). Story 6.1 replaces this with `useContext(AuthContext)`.

### `main.jsx` change

Add `BrowserRouter`:

```jsx
import { BrowserRouter } from 'react-router-dom';
// ... existing imports

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
```

### Page file pattern (apply to all three)

Each page is a default-export function component that:
- Accepts cross-page state via props (no global access yet — explicit data flow).
- Uses `useNavigate` for programmatic navigation.
- Uses `<Link to="...">` for declarative nav (no full-page reload).

Example skeleton for `pages/Calculator.jsx`:

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

const isValidExpression = (expr) => { /* unchanged from old App.jsx */ };

const Calculator = ({ user, history, setHistory, onLogout }) => {
  const [input, setInput] = useState('');

  const handleClick = (value) => setInput((prev) => prev + value);
  const handleClear = () => setInput('');
  const handleDelete = () => setInput((prev) => prev.slice(0, -1));

  // TODO(6.3): replace eval with backend POST /api/calculations
  const handleCalculate = () => {
    if (!isValidExpression(input)) { setInput('Invalid'); return; }
    try {
      const expression = input;
      const normalized = expression.replace(/x/g, '*');
      const result = eval(normalized).toString();
      setInput(result);
      setHistory((prev) => [
        { expression, result, createdAt: new Date().toISOString(), username: user },
        ...prev,
      ]);
    } catch { setInput('Error'); }
  };

  return (
    <div className="calculator-container">
      <div className="calculator">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Link to="/history">History</Link>
          <button className="btn control" onClick={onLogout}>Logout</button>
        </div>
        <div className="display">{input || '0'}</div>
        <div className="buttons">
          {/* keypad copied verbatim from current App.jsx — no changes */}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
```

### Critical preservation rules

1. **Validator logic unchanged.** Move `isValidExpression` into `pages/Calculator.jsx` for now (it'll be extracted in 3.7).
2. **Eval still in place.** Same `expression.replace(/x/g, '*')` + `eval(normalized)` flow. Comment marker `// TODO(6.3): replace eval with backend POST` so 6.3 finds it.
3. **`localStorage["calc_history"]` source unchanged.** Same JSON shape `{ expression, result, createdAt, username }`. Comment marker `// TODO(6.4): replace with API-backed history hook`.
4. **Login behaviour unchanged.** Hardcoded `users` array stays in `pages/Login.jsx`. Comment marker `// TODO(6.2): replace with API call`.
5. **No MUI components added in this story.** Pages still use the inline styles + `index.css`. MUI re-skin happens in 3.4, 3.5, 3.6.

### Brownfield diff summary

| Today                                           | After this story                                          |
|-------------------------------------------------|------------------------------------------------------------|
| `src/App.jsx` ~250 lines, monolithic            | `src/App.jsx` ~50 lines (router shell + cross-page state) |
| `src/Login.jsx`                                  | `src/pages/Login.jsx` (deleted old location)              |
| Conditional render via `showHistory`             | Routes via `<BrowserRouter>` + `<Routes>`                  |
| URL stays `/`                                    | URL reflects state (`/login`, `/`, `/history`)            |
| History item click → setInput + close history    | **Removed** (per AC 6 + wireframe 2.4)                    |

### Why drop the click-to-reuse feature

- Not in PRD §5 (not in any FR).
- Not shown in the History wireframe (inline in Story 3.6).
- Adds cross-page state-passing complexity that disappears entirely once 6.4 lands the API-backed history.
- "Krata to se epipedo swsto" — keep the scope tight.

### Out of scope

- MUI components (3.4, 3.5, 3.6).
- Real `AuthContext` and Axios interceptors (6.1).
- Validator extraction + tests (3.7).
- Multi-env config (3.3).

### Project Structure Notes

- **NEW:** `src/pages/Login.jsx` (moved from `src/Login.jsx`)
- **NEW:** `src/pages/Calculator.jsx` (extracted from `App.jsx`)
- **NEW:** `src/pages/History.jsx` (extracted from `App.jsx`)
- **DELETE:** `src/Login.jsx` (moved to `pages/`)
- **MODIFY:** `src/App.jsx` (~250 lines → ~50 lines router shell)
- **MODIFY:** `src/main.jsx` (add `<BrowserRouter>`)
- **MODIFY:** `src/HistoryButton.jsx` — `HistoryButton` becomes unnecessary (replaced by `<Link to="/history">`); **delete the file** if no other consumers; otherwise note the dead-code marker in PR description.

### References

- [Source: PRD §1.1 brownfield snapshot, §5 FRs](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.2](../planning-artifacts/epics.md)
- [Source: wireframes 2.2, 2.3, 2.4](../planning-artifacts/) (the AppBar+route layout target)
- React Router v7 quick start: https://reactrouter.com/en/main/start/tutorial

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
