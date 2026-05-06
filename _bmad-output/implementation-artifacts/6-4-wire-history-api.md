# Story 6.4: Wire History to `GET /api/calculations` + search-by-user; remove `localStorage` history

Status: ready-for-dev

## Story

As **an authenticated user on the History page**,
I want **the table to fetch live data from the backend with debounced username search and proper pagination**,
so that **PRD FR4 is satisfied — and the last placeholder (`localStorage["calc_history"]`) and its prop chain are deleted**.

## Acceptance Criteria

1. `pages/History.jsx` no longer accepts `history`, `clearHistory`, or any other prop. It owns its own data via `useEffect` + `apiClient.get('/api/calculations', { params })`.
2. Query params built per request:
   - `page = muiPage + 1` (MUI `TablePagination` is zero-based; backend is one-based per PRD §9 / Story 5.5).
   - `pageSize` from local state (default 20, options `[10, 20, 50]`).
   - `username` only included when the **debounced** search input is non-empty (debounce ≥ 300 ms).
3. UI states:
   - **Loading** → 5 `<Skeleton>` rows (one per `<TableCell colSpan={4}>`).
   - **Loaded with rows** → render rows.
   - **Empty** → `<TableRow><TableCell colSpan={4} align="center">No calculations to show.</TableCell></TableRow>`.
   - **Error** → `<Alert severity="error">Could not load history.</Alert>` above the table.
4. Page resets to 0 whenever the **debounced** search term changes.
5. Concurrent fetches don't race: in-flight fetch's `setItems`/`setError` are skipped if a newer fetch has started (`cancelled` flag or `AbortController`).
6. **`localStorage["calc_history"]` reads/writes are deleted from the entire codebase**:
   - `App.jsx` no longer holds `history` state, `setHistory`, `clearHistory`, or the `useEffect` that persists.
   - `Calculator.jsx` no longer calls `setHistory(...)` after a successful calc; no longer accepts `history`/`setHistory` props.
   - `App.jsx`'s `<Routes>` no longer passes those props.
7. The "Clear" button (added in Story 3.6) is **removed** — there's no `DELETE /api/calculations` endpoint in PRD §9 (out of scope).
8. `grep -rn "calc_history" src/` returns 0 hits.

## Tasks / Subtasks

- [ ] **Task 1 — Rewrite `History.jsx` to fetch from API** (AC: 1, 2, 3, 4, 5, 7)
  - [ ] Replace contents per **Dev Notes → New `History.jsx`**.
  - [ ] Drop the "Clear" button entirely.
  - [ ] Drop the props (no `history`, no `clearHistory`).

- [ ] **Task 2 — Drop the local history from `App.jsx`** (AC: 6)
  - [ ] Remove `useState(() => JSON.parse(localStorage.getItem('calc_history') || '[]'))`.
  - [ ] Remove the `useEffect` that persists `history` to `localStorage`.
  - [ ] Remove `clearHistory`.
  - [ ] Remove the props from the `<Route>` elements.
  - [ ] Remove the `useState` import if it's unused.
  - [ ] Apply the **Dev Notes → New `App.jsx`** version.

- [ ] **Task 3 — Drop `setHistory` from `Calculator.jsx`** (AC: 6)
  - [ ] Remove the props (`history`, `setHistory`).
  - [ ] Remove the `setHistory((prev) => [data, ...prev])` line in `handleCalculate`.
  - [ ] Remove the `// TODO(6.4)` comment.

- [ ] **Task 4 — Verify end-to-end** (AC: all)
  - [ ] Backend running, FE running.
  - [ ] Login → calc a few times (e.g. `1+1`, `2*3`, `10/4`).
  - [ ] Navigate to `/history` → see your three rows, newest first, with timestamp / username / expression / result.
  - [ ] Type `ev` in search → after ~300 ms, list filters to rows with `evi`. Empty search → all rows return.
  - [ ] Change `Rows per page` → list updates, page resets.
  - [ ] Network panel: each fetch sends `page`, `pageSize` (and `username` when filtering).
  - [ ] DevTools → Local Storage: only `token` and `user` keys. **No `calc_history` anywhere.**
  - [ ] `grep -rn "calc_history" src/` → empty.

- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/6.4-wire-history-api`

## Dev Notes

### New `History.jsx`

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, TextField, Stack, Alert,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Paper, Skeleton,
} from '@mui/material';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';

const fmtDate = (iso) => new Date(iso).toLocaleString();

const History = () => {
  const { logout } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);                    // MUI 0-based
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce the search input by 300 ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when search changes.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // Fetch on page / size / search change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = { page: page + 1, pageSize: rowsPerPage };
    if (debouncedSearch) params.username = debouncedSearch;

    apiClient.get('/api/calculations', { params })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) return;     // interceptor (6.1) handles
        setError('Could not load history.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, rowsPerPage, debouncedSearch]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Web Calculator — History</Typography>
          <Button color="inherit" component={Link} to="/">Calculator</Button>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Search by username"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Expression</TableCell>
                <TableCell align="right">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={4}><Skeleton /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No calculations to show.</TableCell>
                </TableRow>
              ) : items.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>{fmtDate(h.createdAt)}</TableCell>
                  <TableCell>{h.username}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{h.expression}</TableCell>
                  <TableCell align="right">{h.result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </TableContainer>
      </Container>
    </>
  );
};

export default History;
```

### New `App.jsx`

```jsx
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

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RequireAuth><CalculatorPage /></RequireAuth>} />
    <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
```

> Down to ~25 lines. Pure router shell — exactly what PRD §11 C6 ("plain layered, props-down") looks like at the end.

### Why the `cancelled` flag

When the user types fast in the search box, multiple debounced fetches can race. Without guarding, the **slowest** response wins and clobbers fresher data. The `cancelled` flag inside the cleanup function guarantees only the **latest** fetch's results land in state.

`AbortController` is an alternative that actually cancels the HTTP request — slightly nicer but adds 5 lines. For an intern, the `cancelled` flag is enough (PRD §11 C6).

### Why the page resets on search change

If the user is on page 5 of 20 results, then types a search filtering down to 3 results, page 5 of 3 results = empty. Resetting to page 0 avoids that empty-page footgun.

### Why drop the "Clear" button

Story 3.6 added it for the local-state history. After this story, history is server-sourced. Clearing would require a `DELETE /api/calculations` endpoint, which isn't in PRD §9. Adding the endpoint is out of scope (no FR demands it).

If a coach later requests it, that's a Phase 4 polish: backend `DELETE /api/calculations?username=...` (admin-only?) + FE button. Not now.

### Cleanup grep checklist (Task 4)

After this story:
- `grep -rn "calc_history" src/` → **0 hits**
- `grep -rn "setHistory" src/` → **0 hits**
- `grep -rn "clearHistory" src/` → **0 hits**
- `grep -rn "TODO(6\\." src/` → **0 hits** (all `// TODO(6.x)` markers from Stories 3.x are now resolved)

This is the cleanup payoff — the codebase is now consistent with the PRD §1.1 brownfield "after" state.

### Out of scope

- A "delete history" admin tool — not in PRD §9.
- Sorting columns other than `createdAt desc` — PRD §9 only requires desc.
- CSV export, advanced filters — not in PRD §5.
- Real-time updates (websockets / SSE) — not in PRD.

### Project Structure Notes

- **MODIFY:** `src/pages/History.jsx` (full rewrite — owns its own data)
- **MODIFY:** `src/App.jsx` (drops history state + props; becomes pure router)
- **MODIFY:** `src/pages/Calculator.jsx` (drops `setHistory` call + `history`/`setHistory` props + `// TODO(6.4)`)

### References

- [Source: PRD §5 FR4; §9 API Surface (GET /api/calculations); §11 C3 (cross-user), C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 6.4 + upstream 5.5 + 6.1](../planning-artifacts/epics.md)
- [Source: Story 5.5 — backend GET contract](./5-5-calculations-get.md)
- [Source: Story 6.1 — AuthContext + interceptors](./6-1-auth-context-axios.md)
- [Source: Story 3.6 — History MUI page (wireframe inline)](./3-6-migrate-history-mui.md)
- MUI TablePagination: https://mui.com/material-ui/api/table-pagination/
- MUI Skeleton: https://mui.com/material-ui/react-skeleton/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
