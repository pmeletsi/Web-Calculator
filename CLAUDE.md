# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint over the repo (flat config in `eslint.config.js`)

There is no test runner configured.

## Architecture

This is a **React 19 + Vite** single-page calculator built as a PwC internship training exercise. The full target stack (per `docs/web-calculator-training.md`) is React frontend + Java/Spring Boot or .NET Core backend + PostgreSQL, but **only the frontend currently exists** — there is no backend, no API layer, and no database. All persistence is done via `localStorage`.

The entire app lives in three components in `src/`:

- `main.jsx` — mounts `<App />` in StrictMode.
- `App.jsx` — the whole calculator. Owns all state (`user`, `input`, `history`, `showHistory`) and gates the calculator behind a login check. It contains both the keypad UI and the history panel; they are toggled via `showHistory`, not routed.
- `Login.jsx` — auth form with a **hardcoded user list** (`evi/1234`, `nik/5678`). The training spec says users may be scripted, so this is intentional, not a stub to replace with real auth unless a backend story is being implemented.
- `HistoryButton.jsx` — trivial button.

### State and persistence
- `user` is mirrored to `localStorage["user"]` on login/logout.
- `history` is mirrored to `localStorage["calc_history"]` via a `useEffect`. Each entry is `{ expression, result, createdAt, username }`.
- The history panel renders only `history.slice(0, 8)`. Search by user (in the spec) is not implemented.

### Calculation engine
`handleCalculate` in `App.jsx` uses **`eval()`** on a normalized expression where `x` → `*`. The spec calls for input validation to prevent error-producing calculations; that lives in `isValidExpression()` at the top of `App.jsx` and is the single source of truth for what is "valid". The `=` button is `disabled` based on the same predicate, and the predicate also gates `handleCalculate`. Changes to allowed operators (e.g., adding `(`, `)`) require updating that regex set, not just the UI.

The display button labels `x` and `%`, but `x` is operator-multiplication (mapped to `*` before eval) and `%` is JavaScript remainder, not "percent of". Don't "fix" this without checking the training doc.

## Repo quirks

- Several files have `" copy"` duplicates (`.gitignore copy`, `package copy.json`, `vite.config copy.js`, `eslint.config copy.js`, `index copy.html`, `README copy.md`, `package-lock copy.json`). These are accidental Windows Explorer duplicates, not a vendored snapshot. Edit the un-suffixed files; do not propagate changes to the `" copy"` versions.
- `_bmad/`, `_bmad-output/`, `.agents/`, `.claude/`, `.tmp/` are tooling/agent scaffolding, not application code.
- `docs/` contains the original training brief (`web-calculator-training.md`) — read it before making scope decisions, since requirements like Gitflow, multi-env config, ORM, and CI/CD are part of the assignment even though they're not yet implemented.
- Greek comments appear in `App.jsx`. Keep them; they're the author's notes.

## ESLint config note

`eslint.config.js` uses ESLint 9 flat config with `no-unused-vars` set to error but ignores identifiers matching `^[A-Z_]` (constants and components). React hooks and react-refresh rules are enabled.
