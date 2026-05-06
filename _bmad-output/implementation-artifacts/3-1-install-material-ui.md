# Story 3.1: Install Material UI + theme + ThemeProvider

Status: ready-for-dev

## Story

As **the team**,
I want **Material UI installed and globally available via a theme**,
so that **subsequent FE migration stories (3.4, 3.5, 3.6) can drop in MUI components without further setup**.

## Acceptance Criteria

1. The MUI core packages are installed and pinned via `^7.0.0` (compatible with React 19): `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`.
2. `src/theme.js` exists and exports a default theme created via `createTheme(...)`.
3. `src/main.jsx` wraps `<App />` in `<ThemeProvider theme={theme}>` and includes `<CssBaseline />`.
4. **No visual change** — the existing Login / Calculator / History UI renders identically (same inline styles, same `index.css`). MUI is purely additive in this story.
5. `npm install` and `npm run build` both succeed; `npm run dev` opens the existing UI.

## Tasks / Subtasks

- [ ] **Task 1 — Install MUI packages** (AC: 1)
  - [ ] `npm install @mui/material@^7 @emotion/react @emotion/styled @mui/icons-material@^7`
  - [ ] Verify `package.json` shows the four entries under `dependencies`.

- [ ] **Task 2 — Create `src/theme.js`** (AC: 2)
  - [ ] Use the snippet in **Dev Notes → `theme.js` content**.
  - [ ] Keep it minimal — palette + typography only. No custom component overrides yet.

- [ ] **Task 3 — Wrap `<App />` in `main.jsx`** (AC: 3)
  - [ ] Use the snippet in **Dev Notes → `main.jsx` rewrite**.
  - [ ] Include `<CssBaseline />` to normalise browser styles.

- [ ] **Task 4 — Verify no regression** (AC: 4, 5)
  - [ ] `npm install` (no warnings of incompatibility).
  - [ ] `npm run dev` → open `http://localhost:5173` → log in (`evi` / `1234`) → calculator renders → history view renders. Visual must be **byte-identical** to before this story.
  - [ ] `npm run build` succeeds; `dist/` produced.
  - [ ] Browser console: no MUI warnings (e.g. about `<NoSsr>`, missing peer deps).

- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/3.1-install-material-ui`

## Dev Notes

### `theme.js` content

Save to `src/theme.js`:

```javascript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: {
    fontFamily: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
    h4: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
});

export default theme;
```

### `main.jsx` rewrite

Replace the current `src/main.jsx` body with:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App.jsx';
import theme from './theme.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
```

### Why MUI v7 (not v6 or v5)

- React 19 support landed in MUI v7. v6 works in many cases but v7 is the maintained line.
- Verify: `npm view @mui/material version` should show 7.x at install time.
- If `npm install` warns about React peer dep, double-check the version range in `package.json` matches `^7.0.0` (not `^6` or older).

### Why Emotion (not styled-components)

- Emotion is MUI's default. styled-components is supported but adds friction (extra `engine` package, more docs to read). Junior project → take the default.

### Why `CssBaseline`

- Resets browser default margins / line-heights so MUI components look the same across browsers.
- Without it, the existing `index.css` may collide with MUI's `<Typography>` defaults later. Adding it now prevents subtle visual drift in 3.3–3.5.

### What this story does NOT do

- Does **not** touch `App.jsx`, `Login.jsx`, `HistoryButton.jsx`, or `index.css`. Pure setup only.
- Does **not** change any visual output — the screenshots before and after this PR are identical.
- Does **not** route or split pages — that's Story 3.2.

### Brownfield safety

After this story, the app stacks two style systems for a short window: MUI (Emotion-driven) and the existing inline styles + `index.css`. This is fine — they coexist cleanly. Stories 3.4, 3.5, 3.6 progressively replace the inline/CSS layer with MUI per page, and `index.css` becomes empty (delete in 3.6).

### Out of scope

- Migrating any component to MUI (that's 3.4, 3.5, 3.6).
- Custom theme breakpoints, dark mode, RTL — not in PRD §6.
- Changing `index.css` — left alone until pages are migrated.

### Project Structure Notes

- **NEW:** `src/theme.js`
- **MODIFY:** `src/main.jsx` (wrap in ThemeProvider + CssBaseline)
- **MODIFY:** `package.json` + `package-lock.json` (4 new deps)

### References

- [Source: PRD §6 NFR1, §7 Tech Stack](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.1](../planning-artifacts/epics.md)
- MUI installation: https://mui.com/material-ui/getting-started/installation/
- MUI theming: https://mui.com/material-ui/customization/theming/
- CssBaseline: https://mui.com/material-ui/react-css-baseline/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
