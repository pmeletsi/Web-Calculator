# Story 7.3: Frontend unit tests — Login + Calculator + History (Vitest + RTL)

Status: ready-for-dev

## Story

As **the team**,
I want **Vitest + React Testing Library tests for each of the three pages**,
so that **the FE has a regression safety net to match the BE's (Stories 7.1 / 7.2) — and so the brief's "decoupled for unit tests" requirement is satisfied on both sides (PRD NFR7)**.

## Acceptance Criteria

1. The dev dependency `@testing-library/user-event` is installed.
2. Three new test files exist, co-located with the page components:
   - `src/pages/Login.test.jsx`
   - `src/pages/Calculator.test.jsx`
   - `src/pages/History.test.jsx`
3. Each page's tests cover at minimum:
   - **Login:** renders form; calls `apiClient.post('/api/auth/login', …)` on submit; renders error `Alert` on 401.
   - **Calculator:** renders display + keypad; `=` is disabled while expression is invalid; clicking `=` with a valid expression calls `apiClient.post('/api/calculations', { expression })` and updates the display with `data.result`.
   - **History:** renders rows from a mocked `apiClient.get('/api/calculations', …)`; renders the "No calculations to show" empty state when the API returns an empty list; typing in the search field eventually triggers a fetch with `username` parameter (after the 300ms debounce).
4. Tests mock `apiClient` via `vi.mock('../lib/apiClient', …)` so no real network calls happen.
5. Each test wraps the component in `<MemoryRouter>` + `<AuthProvider>` (inline, no shared render helper).
6. `npm run test:run` exits 0 with all suites green.

## Tasks / Subtasks

- [ ] **Task 1 — Install user-event** (AC: 1)
  - [ ] `npm install -D @testing-library/user-event`

- [ ] **Task 2 — Write `Login.test.jsx`** (AC: 2, 3, 4, 5)
  - [ ] `src/pages/Login.test.jsx` per **Dev Notes → Login tests**.

- [ ] **Task 3 — Write `Calculator.test.jsx`** (AC: 2, 3, 4, 5)
  - [ ] `src/pages/Calculator.test.jsx` per **Dev Notes → Calculator tests**.

- [ ] **Task 4 — Write `History.test.jsx`** (AC: 2, 3, 4, 5)
  - [ ] `src/pages/History.test.jsx` per **Dev Notes → History tests**.

- [ ] **Task 5 — Verify** (AC: 6)
  - [ ] `npm run test:run` → all green.
  - [ ] Optional: `npx vitest run --coverage` for a coverage report (uses Vitest's built-in c8/v8 coverage).

- [ ] **Task 6 — Open the PR**
  - [ ] Branch: `feature/7.3-fe-tests-vitest`

## Dev Notes

### Login tests

`src/pages/Login.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/AuthContext';
import Login from './Login';

vi.mock('../lib/apiClient', () => ({
  default: { post: vi.fn() },
}));
import apiClient from '../lib/apiClient';

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the form', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls apiClient.post on submit', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { token: 'jwt-abc', username: 'evi' } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/username/i), 'evi');
    await userEvent.type(screen.getByLabelText(/password/i), '1234');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', { username: 'evi', password: '1234' })
    );
  });

  it('renders error Alert on 401', async () => {
    apiClient.post.mockRejectedValueOnce({ response: { status: 401 } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/username/i), 'evi');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
  });
});
```

### Calculator tests

`src/pages/Calculator.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/AuthContext';
import Calculator from './Calculator';

vi.mock('../lib/apiClient', () => ({
  default: { post: vi.fn() },
}));
import apiClient from '../lib/apiClient';

const renderCalc = () => {
  // Pre-seed an authenticated user so RequireAuth-style logic is bypassed.
  localStorage.setItem('token', 'jwt-abc');
  localStorage.setItem('user', 'evi');
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Calculator />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders display and the digit / operator keys', () => {
    renderCalc();
    expect(screen.getByText('0')).toBeInTheDocument();        // initial display
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '=' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '%' })).not.toBeInTheDocument();   // FR2 — no %
  });

  it('disables = while the expression is invalid', async () => {
    renderCalc();
    const equals = screen.getByRole('button', { name: '=' });
    expect(equals).toBeDisabled();                            // empty input

    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(equals).toBeDisabled();                            // trailing operator

    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(equals).not.toBeDisabled();                        // "1+2" valid
  });

  it('calls the API on = and shows the result', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { id: 1, expression: '1+2', result: 3, createdAt: '2026-05-06T00:00:00Z', username: 'evi' },
    });
    renderCalc();

    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '=' }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/api/calculations', { expression: '1+2' })
    );
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });
});
```

### History tests

`src/pages/History.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/AuthContext';
import History from './History';

vi.mock('../lib/apiClient', () => ({
  default: { get: vi.fn() },
}));
import apiClient from '../lib/apiClient';

const renderHistory = () => {
  localStorage.setItem('token', 'jwt-abc');
  localStorage.setItem('user', 'evi');
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <AuthProvider>
        <History />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders rows from the API', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        items: [
          { id: 1, expression: '1+1', result: 2, createdAt: '2026-05-06T10:00:00Z', username: 'evi' },
          { id: 2, expression: '2*3', result: 6, createdAt: '2026-05-06T09:00:00Z', username: 'nik' },
        ],
        total: 2,
      },
    });
    renderHistory();

    await waitFor(() => expect(screen.getByText('1+1')).toBeInTheDocument());
    expect(screen.getByText('2*3')).toBeInTheDocument();
    expect(screen.getByText('evi')).toBeInTheDocument();
    expect(screen.getByText('nik')).toBeInTheDocument();
  });

  it('renders the empty state when the API returns no items', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });
    renderHistory();

    await waitFor(() => expect(screen.getByText(/no calculations to show/i)).toBeInTheDocument());
  });

  it('debounces and refetches with a username param when search changes', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });
    renderHistory();

    // Initial fetch (no username).
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/calculations', { params: { page: 1, pageSize: 20 } }));

    await userEvent.type(screen.getByLabelText(/search by username/i), 'ev');

    // After ≥ 300ms debounce, a new fetch should include the username param.
    await waitFor(
      () => expect(apiClient.get).toHaveBeenCalledWith('/api/calculations', { params: { page: 1, pageSize: 20, username: 'ev' } }),
      { timeout: 1500 }
    );
  });
});
```

### Why mock `apiClient`, not `axios` directly

We export a configured Axios instance from `src/lib/apiClient.js`. Mocking the module at that boundary keeps the test focused on **the page's behaviour, not the HTTP layer**. We trust Axios. We test Login.

### Why pre-seed `localStorage` for Calculator/History

Both pages render under a route guarded by `<RequireAuth>` in production. In tests we render the page directly (not via `<App />`) — but `<AuthProvider>` initialises `user` from `localStorage`. Pre-seeding `localStorage["user"]` keeps `user` truthy so any internal `useAuth()` call returns a valid value for `logout`, AppBar display, etc.

### Why `MemoryRouter`

The pages use `<Link>` and `useNavigate`. Without a router context, RTL throws. `MemoryRouter` is the standard test wrapper — no real URL bar, no history side effects.

### Why no shared `renderWithProviders` helper

Tempting, but adds a layer of indirection that makes failures harder to trace. PRD §11 C6 — keep it boring. Inline the wrappers; copy across files.

### debounce + `waitFor` timeout

The history search debounce is 300ms (from Story 6.4). `waitFor` defaults to 1000ms — usually enough. The test bumps it to 1500ms for safety on slow CI runners.

### Out of scope

- App-level / integration tests with the full router.
- E2E tests with Playwright / Cypress.
- Visual regression tests.
- A11y audits — useful, but not in PRD.
- Coverage thresholds — Story 8.1 (CI) may add gates.

### Project Structure Notes

- **NEW:** `src/pages/Login.test.jsx`
- **NEW:** `src/pages/Calculator.test.jsx`
- **NEW:** `src/pages/History.test.jsx`
- **MODIFY:** `package.json` (`@testing-library/user-event` devDep)

### References

- [Source: PRD §5 FR1, FR2, FR4; §6 NFR7; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 7.3 + upstream 6.2/6.3/6.4](../planning-artifacts/epics.md)
- Vitest docs: https://vitest.dev/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- user-event docs: https://testing-library.com/docs/user-event/intro/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
