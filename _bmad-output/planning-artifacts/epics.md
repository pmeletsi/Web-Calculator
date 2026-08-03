---
projectName: 'Web Calculator'
projectType: 'brownfield'
sourcePrd: 'prd.md'
sourceBrief: 'docs/web-calculator-training.md'
totalEpics: 9
totalStories: 37
techStack: 'React 19 + Vite + Material UI / .NET Core + EF Core / SQL Server'
---

# Web Calculator — Epics & User Stories (Brownfield, Solo Intern)

**Source PRD:** [prd.md](./prd.md)
**Source spec:** [web-calculator-training.md](../../docs/web-calculator-training.md)
**Current state snapshot:** PRD §1.1
**Solo descope:** PRD §11 C7

---

## How this is organised

- **Brownfield-aware:** the work starts from Evi's existing partial frontend (Login + Calculator + History with `localStorage` + `eval`). Each migration story explicitly says **what to remove** so placeholder code does not linger.
- **9 active epics, 37 stories.** Epic 2 (separate ER/Wireframe documents) was dropped per PRD §11 C7 — the diagrams now live inline in their owning stories. Epic 10 (Admin Role) is a **post-PRD addition** — it supersedes PRD §11 C2 ("no admin UI"), which was written before an admin capability was requested.
- **Story IDs reflect serial pickup order.** Within each epic, `<epic>.<n>` numbers run 1, 2, 3… in the order Evi picks them up. Pick `1.1` first, then `1.2`, then `3.1`, then `3.2`, … straight through to `9.2`, then `10.1`–`10.8` once Epics 5 and 6 are merged. Epic 2 is intentionally skipped (was dropped); other epics follow normally.
- **Serial workflow.** Evi works one story at a time: branch off `main` → implement → PR → coach reviews → merge → next story. No `develop` / `release` / `hotfix` branches; no KanBan board; no branch protection (PRD §11 C7).
- **Story files are the source of truth.** Each story has a full file under `_bmad-output/implementation-artifacts/<id>-<slug>.md` with acceptance criteria, tasks, and dev notes. This document is just the index + dependency map.
- Story IDs feed branch names (`feature/<story-id>-<slug>`) and PR titles for traceability (NFR5).

**Effort scale:** XS (≤ 2h) · S (½–1d) · M (1–2d) · L (3–5d). Junior developer with coach support.

**Status legend:** `Todo` · `In Progress` · `Blocked` · `Done` (lifecycle in `sprint-status.yaml`).

---

## Serial Execution Roadmap

The order Evi picks stories up. Each row is one branch → one PR → one coach review → merge. Picking the *next* story always means the previous one is merged. Story IDs are **already in pickup order** — just read top-to-bottom.

| # | Story | Why now | Effort |
|---|---|---|---|
| 1 | [1.1 — Cleanup `_copy` files](../implementation-artifacts/1-1-cleanup-copy-files.md) | Quick win; clean repo before anything else | XS |
| 2 | [1.2 — README + setup notes + decisions log](../implementation-artifacts/1-2-readme-and-setup.md) | Doc baseline; coach can onboard from this | M |
| 3 | [3.1 — Install Material UI + theme](../implementation-artifacts/3-1-install-material-ui.md) | First FE story; nothing visual changes yet | S |
| 4 | [3.2 — Add React Router](../implementation-artifacts/3-2-add-react-router.md) | Splits `App.jsx` into `pages/`; unblocks 3.4-3.6 | M |
| 5 | [3.3 — Multi-env FE config + Axios client](../implementation-artifacts/3-3-multi-env-config.md) | `apiClient` shell ready for Epic 6; pulled forward | S |
| 6 | [3.4 — Migrate Login to MUI](../implementation-artifacts/3-4-migrate-login-mui.md) | Per-page re-skin starts | S |
| 7 | [3.5 — Migrate Calculator to MUI + drop `%`](../implementation-artifacts/3-5-migrate-calculator-mui.md) | Drops `%` from the validator (FR2) | M |
| 8 | [3.6 — Migrate History to MUI](../implementation-artifacts/3-6-migrate-history-mui.md) | Wireframe + table shell; still on `localStorage` | M |
| 9 | [3.7 — Extract validator + Vitest baseline](../implementation-artifacts/3-7-extract-validator-vitest.md) | First test infrastructure; muscle for TDD | S |
| 10 | [4.1 — Scaffold ASP.NET Core](../implementation-artifacts/4-1-scaffold-aspnet-api.md) | Backend skeleton + `/healthz` | M |
| 11 | [4.2 — EF Core + SQL Server connection](../implementation-artifacts/4-2-efcore-sqlserver-connection.md) | DbContext + multi-env connection string | M |
| 12 | [4.3 — `Users` + `Calculations` tables](../implementation-artifacts/4-3-users-calculations-tables.md) | First migration; ERD lives inline here | S |
| 13 | [4.4 — Seed users with BCrypt](../implementation-artifacts/4-4-seed-users-bcrypt.md) | `evi`/`nik` rows in DB so Login can hit them | S |
| 14 | [5.1 — `ExpressionValidator` service](../implementation-artifacts/5-1-expression-validator.md) | Pure logic; can be tested before any controller | M |
| 15 | [5.2 — `POST /api/auth/login`](../implementation-artifacts/5-2-auth-login-jwt.md) | First real endpoint; issues JWT | M |
| 16 | [5.3 — JWT middleware + CORS](../implementation-artifacts/5-3-jwt-middleware.md) | Protects calculation endpoints | S |
| 17 | [5.4 — `POST /api/calculations`](../implementation-artifacts/5-4-calculations-post.md) | Validate → evaluate → persist | M |
| 18 | [5.5 — `GET /api/calculations`](../implementation-artifacts/5-5-calculations-get.md) | History data source for FE | M |
| 19 | [6.1 — `AuthContext` + Axios + interceptors](../implementation-artifacts/6-1-auth-context-axios.md) | FE↔BE plumbing; replaces `localStorage["user"]` | M |
| 20 | [6.2 — Wire Login to API](../implementation-artifacts/6-2-wire-login-api.md) | Removes hardcoded users | S |
| 21 | [6.3 — Wire Calculator to API](../implementation-artifacts/6-3-wire-calculator-api.md) | **Removes `eval`** — biggest security win | M |
| 22 | [6.4 — Wire History to API](../implementation-artifacts/6-4-wire-history-api.md) | Removes `localStorage["calc_history"]`; brownfield migration complete | M |
| 23 | [7.1 — BE tests: validator + service](../implementation-artifacts/7-1-be-tests-validator.md) | xUnit baseline; ≥ 90 % coverage on the two key BE classes | M |
| 24 | [7.2 — BE tests: auth + JWT](../implementation-artifacts/7-2-be-tests-auth.md) | Login + token issuance covered | S |
| 25 | [7.3 — FE tests: components + hooks](../implementation-artifacts/7-3-fe-tests-vitest.md) | Vitest + RTL across all three pages | M |
| 26 | [7.4 — SonarLint baseline clean](../implementation-artifacts/7-4-sonarlint-clean.md) | Zero Critical/Blocker on FE + BE | S |
| 27 | [8.1 — CI workflow (BE + FE)](../implementation-artifacts/8-1-ci-workflow.md) | GitHub Actions for both apps; closes brief Phase 3 | M |
| 28 | [9.1 — AI-assisted rebuild (new repo)](../implementation-artifacts/9-1-ai-rebuild.md) | Brief Phase 4; in a separate repository | L |
| 29 | [9.2 — Reflection write-up](../implementation-artifacts/9-2-ai-reflection.md) | What Copilot helped with vs. misled on | S |
| 30 | [10.1 — `Role` on `User` + migration + seed admin](../implementation-artifacts/10-1-user-role-migration.md) | New scope: Admin foundation; needs Epic 4's schema | S |
| 31 | [10.2 — JWT `role` claim + `[Authorize(Roles="Admin")]`](../implementation-artifacts/10-2-jwt-role-authorization.md) | Gates every admin-only endpoint | S |
| 32 | [10.3 — Admin users CRUD API](../implementation-artifacts/10-3-admin-users-crud.md) | Create/delete accounts (this request's core ask) | M |
| 33 | [10.4 — Admin calculations history API](../implementation-artifacts/10-4-admin-calculations-history.md) | View all users' calculation history | S |
| 34 | [10.5 — Admin route guard + nav entry](../implementation-artifacts/10-5-admin-route-guard-nav.md) | FE plumbing before the two admin pages | S |
| 35 | [10.6 — Admin Users page (create/delete)](../implementation-artifacts/10-6-admin-users-page.md) | UI for 10.3 | M |
| 36 | [10.7 — Admin History page (all users)](../implementation-artifacts/10-7-admin-history-page.md) | UI for 10.4 | M |
| 37 | [10.8 — Admin tests (BE + FE)](../implementation-artifacts/10-8-admin-tests.md) | Coverage + SonarLint clean for the new surface | M |

> **Total: 37 stories.** At a sustained "1 story merged per coach-feedback cycle" cadence, this is the entire training exercise (Epic 10 added post-PRD).

---

## Epic 1 — Foundation (cleanup + README)
**Phase:** 1 (Analysis & Design) + 2 (Core)
**Goal:** Minimal doc baseline + a clean repo before any code work begins. Solo-intern descope (PRD §11 C7) cut Gitflow ceremony, the KanBan board, and the local-tooling guide.

| Story | What | Depends on | Effort |
|---|---|---|---|
| [1.1](../implementation-artifacts/1-1-cleanup-copy-files.md) | Delete the 7 accidental `_copy` files at repo root | — | XS |
| [1.2](../implementation-artifacts/1-2-readme-and-setup.md) | README rewrite + `docs/decisions.md` (D1-D6) + setup verification checklist | — | M |

**Satisfies:** NFR3 (SonarLint install in setup notes), NFR4/5 (branch convention documented in README).

---

## Epic 3 — Frontend Modernisation (no behaviour change yet)
**Phase:** 2 (extends existing FE)
**Goal:** Re-skin the existing UI with Material UI + Router + Vitest baseline. Local logic (`eval`, hardcoded users, `localStorage`) **stays** for now — it gets replaced in Epic 6 once the backend exists. `// TODO(6.x)` markers keep the dead-code removal honest.

| Story | What | Depends on | Effort |
|---|---|---|---|
| [3.1](../implementation-artifacts/3-1-install-material-ui.md) | Install `@mui/material` + Emotion + icons; `<ThemeProvider>` wrap | — | S |
| [3.2](../implementation-artifacts/3-2-add-react-router.md) | `react-router-dom`; `/login`/`/`/`/history`; `<RequireAuth>` placeholder | 3.1 | M |
| [3.3](../implementation-artifacts/3-3-multi-env-config.md) | `.env.development`/`.env.production`; `VITE_API_BASE_URL`; `apiClient` shell | 3.1 | S |
| [3.4](../implementation-artifacts/3-4-migrate-login-mui.md) | MUI re-skin of Login (form + Alert); wireframe lives inline in the story | 3.2 | S |
| [3.5](../implementation-artifacts/3-5-migrate-calculator-mui.md) | MUI re-skin of Calculator + **drop `%`** (validator updated here, not 3.7) | 3.2 | M |
| [3.6](../implementation-artifacts/3-6-migrate-history-mui.md) | MUI Table re-skin of History; wireframe inline; pagination/search are UI-only | 3.2 | M |
| [3.7](../implementation-artifacts/3-7-extract-validator-vitest.md) | Move validator to `src/lib/`; add Vitest + RTL + `jsdom`; first test file | 3.5 | S |

**Satisfies:** NFR1, NFR6, NFR7 + FR2 (UI), FR4 (UI), FR5.

---

## Epic 4 — Backend Foundation (.NET Core + EF Core + SQL Server)
**Phase:** 2
**Goal:** Stand up the API skeleton, persistence layer, and seed data so feature endpoints can plug in. Strictly plain layered architecture per PRD §11 C6 — no Clean Architecture, no Repository pattern, no `IEntityTypeConfiguration<T>` files.

| Story | What | Depends on | Effort |
|---|---|---|---|
| [4.1](../implementation-artifacts/4-1-scaffold-aspnet-api.md) | `backend/WebCalculator.sln` with **two** projects (`.Api` + `.Tests`); `/healthz` | — | M |
| [4.2](../implementation-artifacts/4-2-efcore-sqlserver-connection.md) | EF Core + SQL Server packages; `AppDbContext`; multi-env connection strings | 4.1 | M |
| [4.3](../implementation-artifacts/4-3-users-calculations-tables.md) | Entities + `OnModelCreating` + `InitialCreate` migration + `sql/001_create_schema.sql` (ERD inline) | 4.2 | S |
| [4.4](../implementation-artifacts/4-4-seed-users-bcrypt.md) | Seed `evi`/`nik` with BCrypt hashes via `HasData` + `002_seed_users.sql` mirror | 4.3 | S |

**Satisfies:** NFR1, NFR6, NFR7, NFR8, FR1, FR3, FR4, C6.

---

## Epic 5 — Backend APIs
**Phase:** 2
**Goal:** Expose the contracts the frontend will call. JWT-authenticated endpoints with safe expression evaluation (NCalc, never `eval`).

| Story | What | Depends on | Effort |
|---|---|---|---|
| [5.1](../implementation-artifacts/5-1-expression-validator.md) | `ExpressionValidator` service (mirror of FE rules + parens + division-by-zero) | 4.1 | M |
| [5.2](../implementation-artifacts/5-2-auth-login-jwt.md) | `POST /api/auth/login` issues JWT (HS256, claims `sub`/`uid`/`jti`/`exp`) | 4.4 | M |
| [5.3](../implementation-artifacts/5-3-jwt-middleware.md) | JWT bearer middleware + CORS allow-list; `[Authorize]` on calc controller | 5.2 | S |
| [5.4](../implementation-artifacts/5-4-calculations-post.md) | `POST /api/calculations` — validate → NCalc evaluate → persist | 5.1, 5.3 | M |
| [5.5](../implementation-artifacts/5-5-calculations-get.md) | `GET /api/calculations?username=&page=&pageSize=` with `{items,total}` | 5.3, 4.3 | M |

**Satisfies:** FR1, FR2, FR3, FR4, FR5, NFR6, NFR7.

---

## Epic 6 — Frontend ↔ Backend Wiring
**Phase:** 2
**Goal:** Replace every placeholder in the existing FE with real API calls and **delete the dead code**. After this epic, `localStorage["user"]`, `localStorage["calc_history"]`, the hardcoded users array, and `eval` are all gone — the brownfield migration is complete.

| Story | What | Depends on | Effort |
|---|---|---|---|
| [6.1](../implementation-artifacts/6-1-auth-context-axios.md) | `AuthContext` + Axios + JWT request interceptor + 401 response interceptor + real `<RequireAuth>` | 5.2, 3.3 | M |
| [6.2](../implementation-artifacts/6-2-wire-login-api.md) | `Login.jsx` calls `POST /api/auth/login`; **hardcoded users array deleted** | 6.1 | S |
| [6.3](../implementation-artifacts/6-3-wire-calculator-api.md) | `Calculator.jsx` calls `POST /api/calculations`; **`eval` deleted** | 5.4, 6.1, 3.5, 3.7 | M |
| [6.4](../implementation-artifacts/6-4-wire-history-api.md) | `History.jsx` calls `GET /api/calculations` with debounced search; **`localStorage["calc_history"]` deleted** | 5.5, 6.1, 3.6 | M |

**Satisfies:** FR1, FR2, FR3, FR4, FR5, FR6.

---

## Epic 7 — Quality & Tests
**Phase:** 2 (cross-cutting)
**Goal:** Decoupled code is exercised by tests; SonarLint stays clean on both apps. Tests use EF Core InMemory provider per-test fresh DB (no shared state).

| Story | What | Depends on | Effort |
|---|---|---|---|
| [7.1](../implementation-artifacts/7-1-be-tests-validator.md) | xUnit tests for `ExpressionValidator` + `CalculationService` (≥ 90 % cov) | 5.4 | M |
| [7.2](../implementation-artifacts/7-2-be-tests-auth.md) | xUnit tests for auth service + JWT issuance (BCrypt + bad-creds path) | 5.2 | S |
| [7.3](../implementation-artifacts/7-3-fe-tests-vitest.md) | Vitest + RTL across `Login`, `Calculator`, `History` (debounce path included) | 6.4, 3.7 | M |
| [7.4](../implementation-artifacts/7-4-sonarlint-clean.md) | Zero Critical/Blocker on FE + BE; suppressions documented inline | 7.1, 7.3 | S |

**Satisfies:** NFR3, NFR7.

---

## Epic 8 — CI/CD
**Phase:** 3
**Goal:** Automated build + test on every PR + on push to `main`. Solo-intern descope (PRD §11 C7) merged BE + FE workflow stories into one and dropped the branch-protection story (it's a one-click GitHub setting, not story-worthy).

| Story | What | Depends on | Effort |
|---|---|---|---|
| [8.1](../implementation-artifacts/8-1-ci-workflow.md) | `.github/workflows/backend.yml` + `.github/workflows/frontend.yml` (build + test + artifacts) | 7.1, 7.3 | M |

**Satisfies:** NFR9.

---

## Epic 9 — AI-Assisted Re-implementation
**Phase:** 4
**Goal:** Recreate the project in a new repo using GitHub Copilot, as the brief's Phase 4 prescribes. Comparison vs. the Epic 7 baseline is the deliverable.

| Story | What | Depends on | Effort |
|---|---|---|---|
| [9.1](../implementation-artifacts/9-1-ai-rebuild.md) | New repo (`web-calculator-ai`); rebuild end-to-end with Copilot, suggestions documented per commit | Epic 7 done | L |
| [9.2](../implementation-artifacts/9-2-ai-reflection.md) | `docs/ai-reflection.md` — where Copilot accelerated, where it misled, security/quality deltas | 9.1 | S |

---

## Epic 10 — Admin Role & Management
**Phase:** post-PRD addition (requested after initial planning)
**Goal:** Give a subset of users an **Admin** role that can create and delete user accounts and view every user's calculation history — closing the gap left by PRD §11 C2 ("scripted users, no admin UI"), which predates this request. Same architecture ceiling as the rest of the backend (PRD §11 C6: plain Controller → Service → DbContext, no Repository pattern) and the same MUI/`pages/` conventions on the frontend.

| Story | What | Depends on | Effort |
|---|---|---|---|
| [10.1](../implementation-artifacts/10-1-user-role-migration.md) | Add `Role` column to `User` (`"User"` \| `"Admin"`); migration; seed one admin account | 4.3, 4.4 | S |
| [10.2](../implementation-artifacts/10-2-jwt-role-authorization.md) | JWT carries a `role` claim; `AdminController` stub gated by `[Authorize(Roles="Admin")]` | 5.2, 5.3, 10.1 | S |
| [10.3](../implementation-artifacts/10-3-admin-users-crud.md) | `GET/POST/DELETE /api/admin/users` — list, create, delete accounts | 10.2 | M |
| [10.4](../implementation-artifacts/10-4-admin-calculations-history.md) | Role-aware `GET /api/calculations` — non-admins see only their own history, Admins can see any/all | 10.2, 5.5 | S |
| [10.5](../implementation-artifacts/10-5-admin-route-guard-nav.md) | `AuthContext` exposes `role`; `<RequireAdmin>` guard; `/admin/*` routes + nav entry | 6.1, 10.2 | S |
| [10.6](../implementation-artifacts/10-6-admin-users-page.md) | `pages/AdminUsers.jsx` — MUI table + create/delete dialogs, wired to 10.3 | 10.3, 10.5 | M |
| [10.7](../implementation-artifacts/10-7-admin-history-page.md) | `pages/AdminHistory.jsx` — MUI table of every user's calculations, filter by username, wired to 10.4 | 10.4, 10.5 | M |
| [10.8](../implementation-artifacts/10-8-admin-tests.md) | xUnit tests for `AdminController`/role checks + Vitest/RTL tests for the two admin pages | 10.3, 10.4, 10.6, 10.7 | M |

**Satisfies:** New scope (post-PRD) — supersedes PRD §11 C2. No change to FR1-FR6 or existing non-admin behaviour: a non-admin's calculator/history/login flows are unaffected.

---

## Cross-epic dependency map

```
1.1  ─→ (none — quick cleanup, anywhere)
1.2  ─→ (none — doc baseline, anywhere)

3.1  ─→ 3.2 ┬─→ 3.4
            ├─→ 3.5 ─→ 3.7
            └─→ 3.6
3.1  ─→ 3.3

4.1  ─→ 4.2 ─→ 4.3 ─→ 4.4 ─→ 5.2 ─→ 5.3 ─→ 5.4
                                       └─→ 5.5
4.1  ─→ 5.1 ─→ 5.4

5.2 + 3.3  ─→ 6.1 ┬─→ 6.2
                  ├─→ 6.3   (also needs 5.4, 3.5, 3.7)
                  └─→ 6.4   (also needs 5.5, 3.6)

5.4  ─→ 7.1
5.2  ─→ 7.2
6.4 + 3.7  ─→ 7.3
7.1 + 7.3  ─→ 7.4

7.1 + 7.3  ─→ 8.1

(Epic 7 done)  ─→ 9.1 ─→ 9.2

4.3 + 4.4  ─→ 10.1 ─→ 10.2 ┬─→ 10.3 ─→ 10.6
                          └─→ 10.4 (also needs 5.5) ─→ 10.7
6.1 + 10.2  ─→ 10.5 ┬─→ 10.6
                    └─→ 10.7
10.3 + 10.4 + 10.6 + 10.7  ─→ 10.8
```

The Serial Execution Roadmap above linearises this graph in a way that respects dependencies and minimises context-switching.

---

## Definition of Done (applies to every story)

1. Branch `feature/<story-id>-<slug>` opened off `main`.
2. Code merged to `main` via PR titled `[<story-id>] <short summary>`.
3. All acceptance criteria in the story file checked off.
4. Unit tests added/updated where relevant; `dotnet test` + `npm test` green locally (CI required from Story 8.1 onward).
5. SonarLint clean (no new `Blocker` / `Critical`).
6. Story-specific dev notes followed (especially "what to remove" for migration stories).
7. Coach review approved on the PR; coach merges.
8. `sprint-status.yaml` updated: that story moves to `done`.
