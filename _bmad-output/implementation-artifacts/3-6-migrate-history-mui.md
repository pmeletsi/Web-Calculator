# Story 3.6: Migrate History view to Material UI `Table`

Status: ready-for-dev

## Story

As **a developer modernising the UI layer**,
I want **the History page rebuilt with MUI `Table` + search + pagination per the wireframe**,
so that **the page matches the agreed visual design and is ready for the API-backed swap in Story 6.4 — and the legacy `index.css` can finally be retired**.

## Acceptance Criteria

1. `src/pages/History.jsx` uses MUI components throughout — `AppBar`, `Toolbar`, `Container`, `Typography`, `TextField`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TablePagination`. No inline `style={…}`, no plain HTML tables/lists.
2. The page matches wireframe `docs/design/wireframes/history.md`:
   - `AppBar` with title (left), `Calculator` link (right), `Logout` (far right).
   - Search `TextField` above the table, **debounced ≥ 300 ms** before applying the filter.
   - `Table` with exactly four columns in this order: **Timestamp · Username · Expression · Result**. The Result column is right-aligned.
   - `TablePagination` at the bottom; default `rowsPerPage` = 20, options `[10, 20, 50]`.
3. Empty state when filtered list is empty: a single full-width row with `<Typography>No calculations to show.</Typography>`.
4. **Source data is still `localStorage["calc_history"]`** (read via the prop chain set up in 3.2). The wiring to the backend is **Story 6.4** — leave a `// TODO(6.4): replace with GET /api/calculations` comment above the data destination.
5. The legacy CSS classes in `index.css` (`.calculator-container`, `.calculator`, `.display`, `.buttons`, `.btn`, `.history`, `.history-list`, `.history-item`, `.login-form`, etc.) are **deleted** in this PR — the file becomes empty (or contains only minimal global resets, e.g. `:root { color-scheme: light; }`). All three pages now own their styling via MUI.
6. The "Clear" button stays (existing functionality) — wired to the `clearHistory` prop, rendered as a MUI `Button color="warning"` in the AppBar or above the search field.
7. No console errors or MUI warnings.

## Tasks / Subtasks

- [ ] **Task 1 — Top-level layout** (AC: 1, 2)
  - [ ] Wrap the page in `<Container maxWidth="lg" sx={{ mt: 3 }}>`.
  - [ ] Add `<AppBar position="static">` with the same pattern as Calculator (3.5): title, `<Button component={Link} to="/">Calculator</Button>`, `<Button onClick={onLogout}>Logout</Button>`.

- [ ] **Task 2 — Search field with debounce** (AC: 2)
  - [ ] Add a `<TextField label="Search by username" size="small" fullWidth />` above the table.
  - [ ] Use the debounce snippet in **Dev Notes → Search debounce hook**.

- [ ] **Task 3 — Build the MUI `Table`** (AC: 1, 2)
  - [ ] Use `<TableContainer component={Paper}>` wrapping `<Table>` with `<TableHead>` and `<TableBody>`.
  - [ ] Columns: Timestamp · Username · Expression · Result. Result is `align="right"`.
  - [ ] Render a `<TableRow>` per item in the **paginated, filtered slice** of `history`.

- [ ] **Task 4 — Pagination** (AC: 2)
  - [ ] Add `<TablePagination>` below the table.
  - [ ] State: `page` (zero-based), `rowsPerPage`. Defaults: `page=0`, `rowsPerPage=20`.
  - [ ] On `onPageChange` and `onRowsPerPageChange`, update state. Reset `page` to 0 when search term changes.

- [ ] **Task 5 — Empty state** (AC: 3)
  - [ ] When `filtered.length === 0`, render a single `<TableRow>` with one `<TableCell colSpan={4} align="center">No calculations to show.</TableCell>`.

- [ ] **Task 6 — Add "Clear" action** (AC: 6)
  - [ ] Render a `<Button color="warning" variant="outlined" onClick={clearHistory}>Clear</Button>` next to or above the search field.

- [ ] **Task 7 — Add the TODO marker** (AC: 4)
  - [ ] Above the `history` prop usage, add `// TODO(6.4): replace local history prop with GET /api/calculations + server-side filter + server-side pagination`.

- [ ] **Task 8 — Delete legacy CSS** (AC: 5)
  - [ ] Open `src/index.css`. Delete the rules listed in **Dev Notes → CSS classes to delete**.
  - [ ] Confirm no MUI page renders depend on these classes (none should after 3.3, 3.4, this story).
  - [ ] If `index.css` becomes empty, leave a one-line comment so the import in `main.jsx` doesn't look broken: `/* MUI handles styling; reserved for future global resets. */`.

- [ ] **Task 9 — Verify end-to-end** (AC: 7)
  - [ ] Login → submit a few calculations from `/` → navigate to `/history`.
  - [ ] Table displays them with timestamp/username/expression/result.
  - [ ] Search by partial username (`ev` should match `evi`); debounce visible (results don't update on every keystroke).
  - [ ] Change `rowsPerPage`; verify pagination updates.
  - [ ] Click `Clear` → table empties → empty state shown.
  - [ ] Browser console: no warnings.
  - [ ] Visit `/` → calculator still works (no styling regression from `index.css` deletion).
  - [ ] Visit `/login` → login form still works (no styling regression).

- [ ] **Task 10 — Open the PR**
  - [ ] Branch: `feature/3.6-migrate-history-mui`

## Dev Notes

### Wireframe (target visual)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Web Calculator     [🧮 Calculator]                       [↩ Logout]         │ ← <AppBar>
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  History                                                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────┐  🔍                │
│  │ Search by username (debounced ≥ 300 ms)              │                    │ ← <TextField>
│  └──────────────────────────────────────────────────────┘                    │
│                                                                              │
│  ┌─────────────────────┬────────────┬─────────────────────────┬───────────┐  │
│  │ Timestamp           │ Username   │ Expression              │    Result │  │ ← <TableHead>
│  ├─────────────────────┼────────────┼─────────────────────────┼───────────┤
│  │ 2026-05-06 12:34:01 │ evi        │ 12 + 4 × (3 - 1)        │        20 │  │
│  │ 2026-05-06 12:33:18 │ nik        │ 100 / 4                 │        25 │  │
│  │ 2026-05-06 12:30:55 │ evi        │ 7 × 8                   │        56 │  │
│  └─────────────────────┴────────────┴─────────────────────────┴───────────┘  │
│                                                                              │
│              Rows per page: 20  ▾    1 – 20 of 87       ‹    ›              │ ← <TablePagination>
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Columns: **Timestamp · Username · Expression · Result**. Result right-aligned. Empty state: "No calculations to show.".

### Reference shape

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, TextField, Stack,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Paper,
} from '@mui/material';

const History = ({ history, clearHistory, onLogout }) => {
  // TODO(6.4): replace local history prop with GET /api/calculations
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when search changes
  useEffect(() => { setPage(0); }, [debouncedSearch]);

  const filtered = !debouncedSearch
    ? history
    : history.filter((h) => (h.username || '').toLowerCase().includes(debouncedSearch));

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const fmtDate = (iso) => new Date(iso).toLocaleString();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Web Calculator — History</Typography>
          <Button color="inherit" component={Link} to="/">Calculator</Button>
          <Button color="inherit" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
          <TextField
            label="Search by username"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button color="warning" variant="outlined" onClick={clearHistory}>Clear</Button>
        </Stack>

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
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No calculations to show.</TableCell>
                </TableRow>
              ) : paged.map((h, i) => (
                <TableRow key={`${h.createdAt}-${i}`}>
                  <TableCell>{fmtDate(h.createdAt)}</TableCell>
                  <TableCell>{h.username || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{h.expression}</TableCell>
                  <TableCell align="right">{h.result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
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

### Search debounce hook

The inline `useEffect` above is fine for a single field; alternatively extract a `useDebounce(value, ms)` hook into `src/lib/useDebounce.js` if you find yourself repeating it elsewhere. **Not required** in this story.

### CSS classes to delete from `index.css`

After this story, none of these should have any consumer left in the codebase. Verify with a grep before deleting:

```
.calculator-container
.calculator
.display
.buttons
.btn
.btn.control
.btn.operator
.btn.equals
.btn.zero
.history
.history-header
.history-empty
.history-list
.history-item
.history-exp
.history-res
.history-details
.login-form
```

After deletion, `index.css` should be effectively empty. Leave a placeholder comment as described in Task 8.

### Why drop the previous "click row to reuse" feature

Already addressed in Story 3.2 + wireframe 2.4 — out of PRD scope, simplifies cross-page state, and removes a UX corner case (does the "reused" expression replace or append to the current display?).

### Why pagination defaults of `[10, 20, 50]`

- `20` is the PRD §9 default for the backend `pageSize` query param.
- `10` and `50` are sensible bracketing options. PRD Open Question Q2 might revisit; current defaults are safe.

### Brownfield removals

After this PR, the following are gone:
- The `<ul className="history-list">` block (lines ~213–243 of original `App.jsx`).
- The `<li className="history-item">` per-row click handler.
- The slice-of-8 cap (`history.slice(0, 8)`) — replaced by real pagination.
- All `index.css` rules listed above — replaced by MUI's component-scoped styling.

### Brownfield diff (data shape — confirm before coding)

The history items still have shape `{ expression, result, createdAt, username }`. This shape was set in `App.jsx` at the calculator's `setHistory((prev) => [...])` call and is preserved through Stories 3.2 and 3.4. **Do not change the shape** — Story 5.5 (backend) returns the same shape, so 6.4 swap-in is field-for-field compatible.

### Out of scope

- Switching the data source to the backend API — that's Story 6.4.
- Sorting (PRD only requires desc by `createdAt`, which the array already enforces because new items are prepended).
- CSV export, advanced filters — not in PRD §5.
- Loading skeletons — added in Story 6.4 once async fetch exists.

### Project Structure Notes

- **MODIFY:** `src/pages/History.jsx` — full UI rewrite.
- **MODIFY:** `src/index.css` — delete legacy classes, leave placeholder comment.
- **NEW:** none (unless you extract `useDebounce` — optional).

### References

- [Source: PRD §5 FR4, §6 NFR1, §9 API surface](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.6 + downstream Story 6.4](../planning-artifacts/epics.md)
- Existing implementation: [`src/App.jsx`](../../src/App.jsx) (history block ~lines 197–243), moved to `pages/History.jsx` after 3.2
- MUI Table: https://mui.com/material-ui/react-table/
- MUI TablePagination: https://mui.com/material-ui/api/table-pagination/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
