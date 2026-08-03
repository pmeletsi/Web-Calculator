# Story 10.7: `pages/AdminHistory.jsx` — every user's calculation history

Status: ready-for-dev

## Story

As **an Admin**,
I want **a page showing every user's calculation history, filterable by username**,
so that **I can audit usage across all accounts without touching the database**.

## Acceptance Criteria

1. `src/pages/AdminHistory.jsx` fetches `GET /api/calculations` (Story 10.4) **without** a `username` filter by default → shows calculations from all users, newest first, paginated (reuses the `{ items, total }` shape from Story 5.5).
2. A username filter control (text field or select populated from `GET /api/admin/users`) lets the Admin narrow the table to one user's history; clearing it returns to the all-users view.
3. Table columns: `Username`, `Expression`, `Result`, `Created At` — `Username` column distinguishes this from the existing per-user `pages/History.jsx` (Story 6.4), which omits it since it's implicitly the logged-in user.
4. Pagination controls (MUI `TablePagination` or equivalent) match the pattern already used in `pages/History.jsx`.
5. Loading and empty states handled the same way as `pages/History.jsx`.
6. This is a **separate component** from `pages/History.jsx` — the existing per-user History page is untouched by this story (it still calls the same `GET /api/calculations` endpoint, still scoped server-side to the caller's own username per Story 10.4).

## Tasks / Subtasks

- [ ] **Task 1 — Page shell + fetch** (AC: 1, 4, 5)
  - [ ] `AdminHistory.jsx` fetches `GET /api/calculations?page=&pageSize=` on mount and on page change.
- [ ] **Task 2 — Username filter** (AC: 2)
  - [ ] Add filter control; refetch with `?username=<value>&page=1` on change (debounced, matching the existing History search pattern from Story 6.4/3.6).
- [ ] **Task 3 — Table with `Username` column** (AC: 3)
- [ ] **Task 4 — Wire into the route** (AC: all)
  - [ ] Replace the `/admin/history` placeholder from Story 10.5 with `<AdminHistory />`.
- [ ] **Task 5 — Manual verification** (AC: all)
  - [ ] As `admin`, no filter: table shows rows from `evi`, `nik`, and anyone else who has calculated, mixed together, newest first.
  - [ ] Filter by `evi` → only her rows.
  - [ ] Clear filter → back to all-users view.
  - [ ] Pagination controls move between pages correctly when there are more rows than one page.
- [ ] **Task 6 — Open the PR**
  - [ ] Branch: `feature/10.7-admin-history-page`

## Dev Notes

Reuse the debounced-search and pagination conventions from `pages/History.jsx` (Stories 3.6/6.4) rather than inventing a new pattern — the only material difference is the added `Username` column and that the filter is optional/global instead of implicit.

### `AdminHistory.jsx` — full component

`src/pages/AdminHistory.jsx`:

```jsx
import { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Container, Stack,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer,
  TextField, TablePagination, CircularProgress, Alert, Skeleton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';

const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function AdminHistory() {
  const { user, logout } = useAuth();

  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(0);   // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // 300ms debounce — same pattern as History.jsx
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);   // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = { page: page + 1, pageSize: rowsPerPage };
    if (debouncedSearch) params.username = debouncedSearch;

    apiClient.get('/api/calculations', { params })
      .then(({ data }) => {
        if (cancelled) return;
        setRows(data.items);
        setTotal(data.total);
      })
      .catch(err => {
        if (cancelled || err.response?.status === 401) return;
        setError('Could not load history.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, rowsPerPage, debouncedSearch]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin — History</Typography>
          <Button color="inherit" component={Link} to="/">Calculator</Button>
          <Button color="inherit" component={Link} to="/admin/users">Users</Button>
          <Button color="inherit" onClick={logout}>Logout ({user})</Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction="row" sx={{ mb: 2 }}>
          <TextField
            label="Filter by username"
            size="small"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            sx={{ width: 280 }}
          />
        </Stack>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Expression</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : rows.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No calculations found.</TableCell>
                  </TableRow>
                )
                : rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.username}</TableCell>
                    <TableCell>{r.expression}</TableCell>
                    <TableCell>{r.result}</TableCell>
                    <TableCell>{fmtDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
        />
      </Container>
    </>
  );
}
```

### Debounce + cancelled fetch pattern

Matches `History.jsx` exactly: the `useEffect` cleanup sets `cancelled = true` so stale responses from earlier debounced requests don't overwrite newer results. Always carry this over when adapting the pattern \u2014 without it, fast typing can produce out-of-order updates.

### Why `Skeleton` rows during loading (instead of a centred spinner)

`History.jsx` uses a full-page `CircularProgress` while loading. Either works, but `Skeleton` rows preserve the table's visual layout during the initial fetch, which is less jarring \u2014 follow whichever pattern the coach prefers for consistency across pages.

### Out of scope

- `AdminUsers.jsx` — Story 10.6.
- Automated tests — Story 10.8.
- Any change to the existing per-user `pages/History.jsx` — untouched by this story.

### Project Structure Notes

- **NEW:** `src/pages/AdminHistory.jsx`
- **MODIFY:** router config — replace the `/admin/history` placeholder from Story 10.5

### References

- [Source: PRD §5 FR9; §11 C3, C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.7](../planning-artifacts/epics.md)
- [Source: Story 10.4 — role-aware `/api/calculations` this consumes](./10-4-admin-calculations-history.md)
- [Source: Story 10.5 — route/guard this plugs into](./10-5-admin-route-guard-nav.md)
- [Source: Story 6.4 / 3.6 — debounced search + pagination conventions reused here](./6-4-wire-history-api.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
