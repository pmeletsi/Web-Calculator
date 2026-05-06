# Story 3.3: Multi-environment FE config + Axios client

Status: ready-for-dev

## Story

As **a developer about to wire the FE to the backend in Epic 6**,
I want **the API base URL externalised per environment and a single configured Axios instance**,
so that **the same build runs against dev / staging / prod with no source changes (PRD NFR6) and Stories 6.x have one place to import the HTTP client**.

## Acceptance Criteria

1. `axios` is installed.
2. `.env.development` exists at the repo root with `VITE_API_BASE_URL=http://localhost:5000` (placeholder; updated in Story 4.1 once the .NET API picks its port).
3. `.env.production` exists at the repo root with `VITE_API_BASE_URL=https://api.example.com` (placeholder; coach updates pre-deploy).
4. `.env.local` is gitignored (verify `.gitignore` already covers `*.local` — it does).
5. `src/lib/apiClient.js` exports a default Axios instance configured with `baseURL: import.meta.env.VITE_API_BASE_URL`.
6. `npm run build -- --mode production` produces a build whose bundled JS contains the **production** URL (verify by greping `dist/`).
7. `npm run dev` starts as before; visiting the app shows no behaviour change (no API calls happen yet — `apiClient` is unused until Story 6.1).
8. The README (Story 1.2) "Getting started" section is updated to mention the env files briefly (one line: "FE reads `VITE_API_BASE_URL` from `.env.development` / `.env.production`").

## Tasks / Subtasks

- [ ] **Task 1 — Install Axios** (AC: 1)
  - [ ] `npm install axios`

- [ ] **Task 2 — Create env files** (AC: 2, 3)
  - [ ] Create `.env.development` at the repo root with one line: `VITE_API_BASE_URL=http://localhost:5000`
  - [ ] Create `.env.production` at the repo root with one line: `VITE_API_BASE_URL=https://api.example.com`
  - [ ] Optional: create `.env.example` (committed) documenting the available variables.

- [ ] **Task 3 — Verify `.gitignore` already excludes local overrides** (AC: 4)
  - [ ] Open `.gitignore`. Confirm a pattern that catches `.env.local` (e.g. existing line `*.local`).
  - [ ] If not present, add `.env.local`.

- [ ] **Task 4 — Create the API client** (AC: 5)
  - [ ] Add `src/lib/apiClient.js` per **Dev Notes → `apiClient.js` content**.

- [ ] **Task 5 — Verify env injection** (AC: 6, 7)
  - [ ] `npm run build` (default mode = production) — open one of the chunks in `dist/assets/*.js` (e.g. `Get-Content dist/assets/index-*.js | Select-String "api.example.com"` on PowerShell). Should match.
  - [ ] `npm run build -- --mode development` produces a build with `localhost:5000` baked in.
  - [ ] `npm run dev` still works; `import.meta.env.VITE_API_BASE_URL` resolves to the `.env.development` value.

- [ ] **Task 6 — Update `README.md`** (AC: 8)
  - [ ] Under "Getting started", add a one-liner: `FE reads `VITE_API_BASE_URL` from `.env.development` (used by `npm run dev`) or `.env.production` (used by `npm run build`). Personal overrides go in `.env.local` (gitignored).`

- [ ] **Task 7 — Open the PR**
  - [ ] Branch: `feature/3.3-multi-env-config`

## Dev Notes

### `apiClient.js` content

`src/lib/apiClient.js`:

```javascript
import axios from 'axios';

// Single configured Axios instance for all backend calls.
// Story 6.1 attaches request/response interceptors (JWT bearer, 401 → logout).
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
```

### Why placeholders for the URLs

- The .NET backend port is decided in **Story 4.1**. Until then, `http://localhost:5000` is the `dotnet new webapi` default and a fine placeholder.
- The production URL is genuinely a coach decision (PaaS deployment is out of scope per PRD §11; if there's no real prod, the value can stay as a placeholder forever — what matters is that it lives outside source).

### Vite env file rules (gotchas to know)

- Only variables starting with `VITE_` are exposed to client code. Anything without that prefix is **stripped** from the bundle for safety.
- `.env.local` overrides `.env`; `.env.[mode].local` overrides `.env.[mode]`. Local files are gitignored by convention (`*.local` already in our `.gitignore`).
- Default mode is `production` for `npm run build` and `development` for `npm run dev`. Override with `--mode <name>`.
- Env values are **inlined at build time**, not read at runtime. To change the URL after a build, you would need to rebuild — that's the trade-off Vite makes for SPA simplicity.

### Why install Axios now (vs in Story 6.1)

Two reasons:
1. Keeps the wiring story (6.1) focused on auth state + interceptors instead of also adding a new dependency.
2. Lets Story 6.x stories all start with `import apiClient from '../lib/apiClient'` from day one.

The `apiClient.js` file is created here but **not yet imported** anywhere (until 6.1 hooks it up). That's fine — it's dead code with a purpose (waiting to be picked up).

### What this story is NOT

- Not a story about calling the backend (that's Epic 6).
- Not about CORS configuration (lives in the backend, Story 5.3).
- Not about secrets management (`.env.local` exists for personal overrides; real secrets would be a Phase 4 / deploy concern that's out of scope).

### Out of scope

- JWT interceptor and 401 handling (Story 6.1).
- React Query / SWR / data-fetching libraries (vanilla Axios is enough for this exercise).
- Service-worker offline caching (not in PRD).

### Project Structure Notes

- **NEW:** `.env.development` (committed, placeholder)
- **NEW:** `.env.production` (committed, placeholder)
- **NEW (optional):** `.env.example` (committed, documents the variables)
- **NEW:** `src/lib/apiClient.js`
- **MODIFY:** `package.json` (axios dep)
- **MODIFY (verify):** `.gitignore` — confirm `*.local` covers `.env.local`
- **MODIFY:** `README.md` — add an "Environment files" line in "Getting started"

### References

- [Source: PRD §6 NFR6 + §7 Tech Stack](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.3 + downstream Story 6.1](../planning-artifacts/epics.md)
- Vite env modes: https://vite.dev/guide/env-and-mode.html
- Axios docs: https://axios-http.com/docs/instance

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
