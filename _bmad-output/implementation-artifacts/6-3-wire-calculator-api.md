# Story 6.3: Wire Calculator to `POST /api/calculations`; remove client-side `eval`

Status: ready-for-dev

## Story

As **an authenticated user pressing `=`**,
I want **the calculator to send my expression to the backend, receive the safely-evaluated result, and surface server-side validation errors via a Snackbar**,
so that **PRD FR2 (calculator), FR3 (audit), and FR5 (validation) are satisfied end-to-end — and the security flaw of running `eval` in the browser is permanently removed (PRD §12 risk register)**.

## Acceptance Criteria

1. On `=`, `Calculator.jsx` calls `apiClient.post('/api/calculations', { expression: input })`.
2. On `200 { id, expression, result, createdAt, username }` → display shows `result.toString()`; the response item is **prepended** to `history` via `setHistory((prev) => [data, ...prev])` (kept until Story 6.4 drops the prop chain).
3. On `400 { reason, message }` → MUI `<Snackbar>` with the server's `message` (or a default if missing), `severity="error"`, auto-hide 4 s. Display retains the original expression so the user can correct it.
4. On `401` → handled silently by the Axios interceptor (Story 6.1); no inline UI here.
5. While the request is in flight, the `=` button shows `<CircularProgress size={20} color="inherit" />` and is disabled.
6. **The `eval(...)` call and its surrounding `try/catch` are deleted** from `handleCalculate`. The `// TODO(6.3)` comment is gone.
7. `grep -n "eval(" src/pages/Calculator.jsx` returns 0 hits.

## Tasks / Subtasks

- [ ] **Task 1 — Rewrite `handleCalculate`** (AC: 1, 2, 3, 4, 6)
  - [ ] Replace the existing `handleCalculate` per **Dev Notes → New `handleCalculate`**.

- [ ] **Task 2 — Add the `submitting` state + `=` button spinner** (AC: 5)
  - [ ] Add `const [submitting, setSubmitting] = useState(false);`
  - [ ] In the `=` button: `disabled={!isValidExpression(input) || submitting}` and content `{submitting ? <CircularProgress size={20} color="inherit" /> : '='}`.

- [ ] **Task 3 — Add the error Snackbar** (AC: 3)
  - [ ] Add `const [error, setError] = useState(null);`
  - [ ] At the bottom of the JSX: `<Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}><Alert severity="error" onClose={() => setError(null)}>{error}</Alert></Snackbar>`.

- [ ] **Task 4 — Remove placeholder code** (AC: 6, 7)
  - [ ] Delete `eval(expression)` and the surrounding `try/catch` body that referenced it.
  - [ ] Delete the `// TODO(6.3): replace with backend POST /api/calculations` comment.
  - [ ] If a leftover `expression.replace(/x/g, '*')` line is still present (Story 3.5 should have removed it), delete it now.

- [ ] **Task 5 — Verify end-to-end** (AC: all)
  - [ ] Backend running.
  - [ ] Login → calculator route.
  - [ ] Type `12+4*3-1` → tap `=` → display shows `23`. Network panel shows `POST /api/calculations` with `{ expression: "12+4*3-1" }` in the body and the response in `{ id, ..., result: 23, ... }` shape.
  - [ ] Type `1+` → `=` button is disabled (FE validator).
  - [ ] Bypass the FE validator by typing into the display directly is not possible — but you can simulate a backend-only failure by typing `(1+2` (FE doesn't have parens, so this won't happen normally). For verification, manually call the API in DevTools console with `apiClient.post('/api/calculations', { expression: '(1+2' })` → 400 → Snackbar appears.
  - [ ] Stop backend, try `=` → Snackbar "Could not calculate. Try again." (network failure path).
  - [ ] After several calculations, navigate to `/history` → see the rows appended (still local-state until 6.4).

- [ ] **Task 6 — Open the PR**
  - [ ] Branch: `feature/6.3-wire-calculator-api`

## Dev Notes

### New `handleCalculate`

```jsx
const handleCalculate = async () => {
  if (!isValidExpression(input)) return;   // belt-and-braces; the button is also disabled
  setSubmitting(true);
  setError(null);
  const expression = input;                 // capture so we can restore on error
  try {
    const { data } = await apiClient.post('/api/calculations', { expression });
    setInput(data.result.toString());
    // TODO(6.4): drop this setHistory call; History page will re-fetch.
    setHistory((prev) => [data, ...prev]);
  } catch (err) {
    if (err.response?.status === 400) {
      const msg = err.response?.data?.message ?? 'Invalid expression';
      setError(msg);
      setInput(expression);                 // restore so the user can correct
    } else if (err.response?.status === 401) {
      // Axios interceptor (Story 6.1) handles cleanup + redirect.
    } else {
      setError('Could not calculate. Try again.');
      setInput(expression);
    }
  } finally {
    setSubmitting(false);
  }
};
```

### Updated `=` button

```jsx
<Button
  fullWidth size="large"
  variant="contained" color="primary"
  disabled={!isValidExpression(input) || submitting}
  onClick={handleCalculate}
>
  {submitting ? <CircularProgress size={20} color="inherit" /> : '='}
</Button>
```

### Snackbar

```jsx
<Snackbar
  open={!!error}
  autoHideDuration={4000}
  onClose={() => setError(null)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
    {error}
  </Alert>
</Snackbar>
```

Required new imports for this story:
```jsx
import { Snackbar, Alert, CircularProgress } from '@mui/material';
import apiClient from '../lib/apiClient';
```

### Diff vs. the post-3.5 file

| Before (3.5)                                              | After (this story)                                  |
|-----------------------------------------------------------|-----------------------------------------------------|
| `try { const result = eval(expression).toString(); ... }` | `await apiClient.post('/api/calculations', ...)`    |
| `setInput('Invalid')` on validation fail                  | the button is already disabled; if hit anyway, returns silently |
| `setInput('Error')` on eval fail                          | `<Snackbar>` with the server reason                 |
| `// TODO(6.3): replace with backend POST`                 | **deleted**                                         |
| no submitting state                                       | `submitting` state + disabled `=` + spinner          |
| no Snackbar                                               | `<Snackbar>` for backend errors                      |

### Why prepend to local `history`

Until Story 6.4 lands, the History page reads from the prop-chained local `history` state (set up in 6.1 / kept from 3.6). Without prepending here, the user would do a calc, navigate to `/history`, and not see their just-now calculation. Annoying.

Once 6.4 lands and History fetches from the API on mount, this `setHistory` call becomes useless — and it's removed (this story leaves the `// TODO(6.4)` marker on it).

### Why restore the expression on error

If the user types `5/0` and hits `=`, getting `Snackbar` "Division by zero" is helpful — but if the display also got cleared, they'd lose context. Restoring the input lets them fix the `0` to `2` and try again. Tiny UX touch.

### Why no separate "submitting" message

The button's spinner is feedback enough. PRD §6 NFR1 doesn't require a status bar. Keep it boring.

### Username for the row

The API returns `username` in the response. We don't need to pass it through `setHistory` — it's already in `data`. The local `history` rows now have all backend fields (`id`, `username`, `expression`, `result`, `createdAt`).

### Out of scope

- Switching the History page off `localStorage` — Story 6.4.
- Removing the local `history` state from `App.jsx` — Story 6.4.
- Keyboard input bindings — possible Phase 4 polish.
- Optimistic UI for `=` — over-engineered for an intern exercise.

### Project Structure Notes

- **MODIFY:** `src/pages/Calculator.jsx` (rewrite `handleCalculate`, add `submitting`/`error` state + Snackbar)
- **NEW:** none.
- **DELETE:** none (file stays; lines change).

### References

- [Source: PRD §5 FR2, FR3, FR5; §9 API Surface (POST /api/calculations); §12 risk register](../planning-artifacts/prd.md)
- [Source: epics.md Story 6.3 + upstream 5.4 + 6.1](../planning-artifacts/epics.md)
- [Source: Story 5.4 — backend POST contract](./5-4-calculations-post.md)
- [Source: Story 6.1 — AuthContext + interceptors](./6-1-auth-context-axios.md)
- MUI Snackbar: https://mui.com/material-ui/react-snackbar/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
