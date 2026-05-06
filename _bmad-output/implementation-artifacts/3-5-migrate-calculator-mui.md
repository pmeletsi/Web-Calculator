# Story 3.5: Migrate Calculator UI to Material UI + drop `%` button + update validator

Status: ready-for-dev

## Story

As **a developer modernising the UI layer**,
I want **the Calculator rebuilt with Material UI per the wireframe**, with **`%` removed** and the **validator updated to accept `*` directly** (since buttons now send ASCII operators),
so that **the calculator matches PRD scope (FR2: only `+ - * /`) and is ready for the server-side eval wiring in Story 6.3**.

## Acceptance Criteria

1. `src/pages/Calculator.jsx` uses MUI components throughout — `AppBar`, `Toolbar`, `Paper` (display), `Grid` (keypad), `Button` (per key), `Snackbar` is **not** required at this stage (it's added in Story 6.3 when server errors first arrive).
2. The page matches the wireframe `docs/design/wireframes/calculator.md`:
   - `AppBar` with title (left), `History` link (right), `Logout` button (far right).
   - `Paper` display showing the running expression (right-aligned).
   - 4-column keypad grid; `0` spans 2 columns.
   - `=` is `variant="contained" color="primary"`; the rest are `variant="outlined"`.
3. The **`%` button is removed** from the keypad entirely.
4. Button **labels** show unicode operators (`×`, `÷`, `−`); button **onClick values** send ASCII operators (`*`, `/`, `-`, `+`). Digits and `.` are sent as-is.
5. The inline `isValidExpression` is updated:
   - Whitelist becomes `0-9 + - * / . space` (drop `x` and `%`; add `*`).
   - Trailing-operator and double-operator regexes updated to match the new operator set.
   - Division-by-zero detection still runs on the raw expression (no normalisation needed since `/` is already the input).
6. `handleCalculate` no longer needs `expression.replace(/x/g, '*')` (already `*`); the `eval` call **stays** for now with an explicit `// TODO(6.3): replace with backend POST /api/calculations` comment.
7. All flows preserved end-to-end: type expression → `=` evaluates with eval → result displayed → history updated. `=` is **disabled** while expression is invalid.
8. No console errors or MUI warnings; the page renders identically to wireframe 2.3.

## Tasks / Subtasks

- [ ] **Task 1 — Replace the page header with `AppBar`** (AC: 1, 2)
  - [ ] Delete the inline `<div style={{ display: 'flex', justifyContent: 'space-between', ...}}>` flex bar.
  - [ ] Add `<AppBar position="static"><Toolbar>` with title `<Typography variant="h6" sx={{ flexGrow: 1 }}>Web Calculator</Typography>`, `History` link via `<Button color="inherit" component={Link} to="/history">History</Button>`, and `<Button color="inherit" onClick={onLogout}>Logout</Button>`.

- [ ] **Task 2 — Replace the display** (AC: 1, 2)
  - [ ] Replace `<div className="display">` with `<Paper sx={{ p: 2, mb: 2, textAlign: 'right', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>`.
  - [ ] Inside, render `<Typography variant="h4" component="div">{input || '0'}</Typography>`.

- [ ] **Task 3 — Replace the keypad with MUI `Grid`** (AC: 1, 2, 3, 4)
  - [ ] Delete the entire `<div className="buttons">` block.
  - [ ] Build the keypad per **Dev Notes → Keypad layout**.
  - [ ] **Do not** include a `%` button (drop entirely).
  - [ ] Confirm operator buttons send ASCII (`*`, `/`, `-`, `+`) but display unicode (`×`, `÷`, `−`, `+`).

- [ ] **Task 4 — Update `isValidExpression`** (AC: 5, 6)
  - [ ] Apply the diff in **Dev Notes → Validator changes**.
  - [ ] Verify by hand that `1*2`, `1+2-3`, `100/4` all return `true`; that `1x2`, `5%3`, `1+`, `1++2` all return `false`.

- [ ] **Task 5 — Add the `eval` TODO marker** (AC: 6)
  - [ ] Above `eval(normalized)`, add `// TODO(6.3): replace with backend POST /api/calculations`.
  - [ ] Remove the `expression.replace(/x/g, '*')` line — no longer needed since input is already ASCII. Update the variable name from `normalized` to `expression` for clarity if desired.

- [ ] **Task 6 — Wrap the page in a containing `Container`** (AC: 1)
  - [ ] Wrap the whole page in `<Container maxWidth="sm" sx={{ mt: 3 }}>` for clean centering.

- [ ] **Task 7 — Verify** (AC: 7, 8)
  - [ ] `npm run dev`, log in.
  - [ ] Type `1 + 2 * 3` (using the new ASCII-sending buttons) → `=` enabled → click → display shows `7`. History grows (verify via `/history`).
  - [ ] Type `1 +` → `=` is **disabled**.
  - [ ] Confirm no `%` button visible.
  - [ ] Confirm AppBar replaces the old flex bar.
  - [ ] Browser console: no warnings.

- [ ] **Task 8 — Open the PR**
  - [ ] Branch: `feature/3.5-migrate-calculator-mui`

## Dev Notes

### Wireframe (target visual)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Web Calculator      [📜 History]               [↩ Logout]       │ ← <AppBar><Toolbar>
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                          12 + 4 × (3 - 1)  │  │ ← <Paper> "display"
│  │                                                       16   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  C   │  │  ⌫  │  │      │  │  ÷   │                          │ ← <Grid> + <Button>
│  └──────┘  └──────┘  └──────┘  └──────┘                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  7   │  │  8   │  │  9   │  │  ×   │                          │
│  └──────┘  └──────┘  └──────┘  └──────┘                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  4   │  │  5   │  │  6   │  │  −   │                          │
│  └──────┘  └──────┘  └──────┘  └──────┘                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  1   │  │  2   │  │  3   │  │  +   │                          │
│  └──────┘  └──────┘  └──────┘  └──────┘                          │
│  ┌─────────────────┐  ┌──────┐  ┌──────┐                         │
│  │        0        │  │  .   │  │  =   │                         │ ← `=` <Button variant="contained">
│  └─────────────────┘  └──────┘  └──────┘                         │   `0` spans 2 columns
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**No `%` button** (PRD FR2 — only `+ - * /`). Operator labels are unicode (`×` `÷` `−`); button onClick values are ASCII (`*` `/` `-`).

### Keypad layout (paste-ready)

```jsx
import { Grid, Button } from '@mui/material';

const keys = [
  // row 1
  { label: 'C',  onClick: handleClear,                    variant: 'outlined', color: 'warning' },
  { label: '⌫', onClick: handleDelete,                   variant: 'outlined', color: 'warning' },
  null, // empty cell — keeps grid alignment
  { label: '÷',  onClick: () => handleClick('/'),         variant: 'outlined', color: 'secondary' },
  // row 2
  { label: '7',  onClick: () => handleClick('7'),         variant: 'outlined' },
  { label: '8',  onClick: () => handleClick('8'),         variant: 'outlined' },
  { label: '9',  onClick: () => handleClick('9'),         variant: 'outlined' },
  { label: '×',  onClick: () => handleClick('*'),         variant: 'outlined', color: 'secondary' },
  // row 3
  { label: '4',  onClick: () => handleClick('4'),         variant: 'outlined' },
  { label: '5',  onClick: () => handleClick('5'),         variant: 'outlined' },
  { label: '6',  onClick: () => handleClick('6'),         variant: 'outlined' },
  { label: '−',  onClick: () => handleClick('-'),         variant: 'outlined', color: 'secondary' },
  // row 4
  { label: '1',  onClick: () => handleClick('1'),         variant: 'outlined' },
  { label: '2',  onClick: () => handleClick('2'),         variant: 'outlined' },
  { label: '3',  onClick: () => handleClick('3'),         variant: 'outlined' },
  { label: '+',  onClick: () => handleClick('+'),         variant: 'outlined', color: 'secondary' },
];

return (
  <>
    {/* AppBar + Container + Paper above … */}
    <Grid container spacing={1}>
      {keys.map((k, i) => (
        <Grid item xs={3} key={i}>
          {k && (
            <Button
              fullWidth size="large"
              variant={k.variant}
              color={k.color}
              onClick={k.onClick}
            >
              {k.label}
            </Button>
          )}
        </Grid>
      ))}

      {/* row 5 — special widths */}
      <Grid item xs={6}>
        <Button fullWidth size="large" variant="outlined" onClick={() => handleClick('0')}>0</Button>
      </Grid>
      <Grid item xs={3}>
        <Button fullWidth size="large" variant="outlined" onClick={() => handleClick('.')}>.</Button>
      </Grid>
      <Grid item xs={3}>
        <Button
          fullWidth size="large"
          variant="contained" color="primary"
          disabled={!isValidExpression(input)}
          onClick={handleCalculate}
        >
          =
        </Button>
      </Grid>
    </Grid>
  </>
);
```

### Validator changes

Current (in `pages/Calculator.jsx` after Story 3.2):

```js
function isValidExpression(expr) {
  if (!expr || expr.trim() === '') return false;
  if (/[+\-x/%\.]$/.test(expr)) return false;
  if (/([+\-x/%]{2,})/.test(expr.replace(/--/g, ''))) return false;
  if (/\.\./.test(expr)) return false;
  if (/[^0-9+\-x/%\.\s]/.test(expr)) return false;
  const norm = expr.replace(/x/g, '*');
  try { if (/\/0(?![0-9\.])/.test(norm)) return false; } catch { return false; }
  return true;
}
```

Updated (this story):

```js
function isValidExpression(expr) {
  if (!expr || expr.trim() === '') return false;
  if (/[+\-*/.]$/.test(expr)) return false;                        // trailing operator/decimal
  if (/([+\-*/]{2,})/.test(expr.replace(/--/g, ''))) return false; // doubled operators (allow leading "--" reasoning preserved)
  if (/\.\./.test(expr)) return false;                              // doubled decimals
  if (/[^0-9+\-*/.\s]/.test(expr)) return false;                    // whitelist: digits, + - * /, dot, whitespace
  if (/\/0(?![0-9.])/.test(expr)) return false;                     // division by zero
  return true;
}
```

Diff in plain English:
- **Add `*`** to all three operator-related regexes (`[+\-*/.]$`, `[+\-*/]{2,}`, `[^0-9+\-*/.\s]`).
- **Drop `x`** from the same three regexes.
- **Drop `%`** from the same three regexes.
- **Drop the normalisation step** — no need to `.replace(/x/g, '*')` because `*` is already the input.
- The try/catch around the regex is unnecessary (`RegExp.test` cannot throw for static patterns) — the simplification removes it.

### `handleCalculate` after this story

```js
const handleCalculate = () => {
  if (!isValidExpression(input)) { setInput('Invalid'); return; }
  try {
    const expression = input;
    // TODO(6.3): replace with backend POST /api/calculations and remove this eval entirely
    const result = eval(expression).toString();
    setInput(result);
    setHistory((prev) => [
      { expression, result, createdAt: new Date().toISOString(), username: user },
      ...prev,
    ]);
  } catch {
    setInput('Error');
  }
};
```

### Why operator label vs value differ

- Visual labels `×`, `÷`, `−` follow standard math notation — better UX (matches what users expect on a calculator).
- Wire values `*`, `/`, `-` are ASCII — what `eval` and the future server validator both expect natively.
- The mapping happens **in the onClick** so the `input` state never contains unicode operators. This means: no risk of the server validator (Story 5.1) ever seeing a non-ASCII operator from the wire.

### Why no `%` button

PRD §5 FR2 requires only `+ - * /`. The current `%` is JavaScript remainder (not "percent of"), which would surprise users and is not in scope. Decision **D4** in `docs/decisions.md` (Story 1.2) ratifies the removal.

### Where the eval lives until 6.3

Inside `handleCalculate`. The `// TODO(6.3)` marker is the breadcrumb. Story 6.3 will:
- Delete the eval line.
- Replace with `const { result } = await apiClient.post('/api/calculations', { expression })`.
- Remove the `try/catch` since errors come back via Snackbar from a 400 response.

### Brownfield removals

After this PR, the following old Calculator artefacts are gone:
- `<div style={{ display: 'flex', ... }}>` flex bar (replaced by `AppBar`).
- `<div className="display">` (replaced by `Paper`).
- `<div className="buttons">` (replaced by `Grid`).
- `<button className="btn …">` × N (replaced by MUI `Button` × N).
- `%` button.
- `x` button label (replaced by `×` label, `*` value).
- `expression.replace(/x/g, '*')` line.
- The dead try/catch around regex check.

The CSS rules in `index.css` for `.calculator-container`, `.calculator`, `.display`, `.buttons`, `.btn`, etc. become **dead code** after this story. Story 3.6 cleans them up once History is also migrated.

### Out of scope

- Server-side validation + persistence wiring (Story 6.3).
- Validator extraction to `src/lib/` (Story 3.7).
- Snackbar for server errors (Story 6.3 introduces it).
- Keyboard input (would be a Phase 4 polish).

### Project Structure Notes

- **MODIFY:** `src/pages/Calculator.jsx` — full UI rewrite + validator update + `eval` TODO marker.
- **NEW:** none.
- **DELETE:** none in this story (CSS cleanup deferred to 3.6).

### References

- [Source: PRD §5 FR2, FR5; §11 C2 / D4](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.5 + downstream Story 6.3](../planning-artifacts/epics.md)
- Existing implementation: [`src/App.jsx`](../../src/App.jsx) (calculator block ~lines 112–195), moved to `pages/Calculator.jsx` after 3.2
- MUI AppBar: https://mui.com/material-ui/react-app-bar/
- MUI Grid: https://mui.com/material-ui/react-grid/
- MUI Button: https://mui.com/material-ui/react-button/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
