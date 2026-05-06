---
stepsCompleted: ['step-01-init', 'fast-track-pm-draft', 'brownfield-update']
inputDocuments:
  - docs/web-calculator-training.md
  - src/App.jsx
  - src/Login.jsx
  - src/HistoryButton.jsx
workflowType: 'prd'
projectName: 'Web Calculator'
projectType: 'brownfield'
techStack:
  frontend: 'React 19 + Vite + Material UI (to add)'
  backend: '.NET Core + EF Core (to build)'
  database: 'SQL Server (to provision)'
---

# Product Requirements Document — Web Calculator

**Author:** Evi
**Date:** 2026-05-06
**Status:** Draft v2 (brownfield-aware)
**Source spec:** [docs/web-calculator-training.md](../../docs/web-calculator-training.md)

---

## 1. Overview

The Web Calculator is a junior-developer training exercise issued by PwC over a 1–2 month period. The deliverable is a working web application where authorized users sign in, perform basic arithmetic, and review previous calculations. The exercise is also a vehicle for the trainee to apply professional engineering practices end-to-end: source control with branch-per-story, multi-environment configuration, an ORM, unit tests, code-quality tooling, and CI/CD.

> The brief originally calls for **Gitflow** + a **KanBan board**. Both are descoped per §11 C7 (solo intern); the underlying intent — story-to-commit traceability — is preserved through the branch/PR convention + `sprint-status.yaml`.

This PRD scopes **only what the training brief asks for**, with the team's stack overrides applied:

- **Frontend:** React + Material UI
- **Backend:** .NET Core + Entity Framework Core
- **Database:** Microsoft SQL Server (training brief originally said PostgreSQL — overridden by team decision)

Anything not listed in the brief is explicitly out of scope.

---

## 1.1 Current State (Brownfield Snapshot — 2026-05-06)

The repository already contains a partial frontend that Evi has built. We are **not starting from zero** — we are evolving what exists.

| Layer / Asset                                     | State                                   | Action in this plan                                                |
|---------------------------------------------------|-----------------------------------------|--------------------------------------------------------------------|
| Vite + React 19 scaffold (`package.json`, `main.jsx`) | ✅ exists                              | Keep                                                               |
| `Login.jsx` UI (form, error state)                | ✅ exists                               | Re-skin with MUI; **remove the hardcoded `users` array** when wired to API |
| `App.jsx` Calculator (display + keypad)           | ✅ exists                               | Re-skin with MUI; **drop the `%` button** (out of FR2 scope)        |
| `App.jsx` History (top-8, conditional render)     | ✅ exists                               | Move to `/history` route, render with MUI `Table`, **drop localStorage source**; the schema `{expression, result, createdAt, username}` matches the planned DB |
| `isValidExpression` (regex validator)             | ✅ exists, sound logic                  | Extract to a shared module; port to backend in `ExpressionValidator` |
| `eval()` for evaluation                           | ⚠️ security flaw                        | **Remove** when wired to backend safe evaluator (FR2 + risk mitigation) |
| `localStorage["user"]` for auth                   | ⚠️ placeholder                          | **Replace** with JWT in `localStorage["token"]` + `AuthContext`     |
| `localStorage["calc_history"]`                    | ⚠️ placeholder                          | **Replace** with `GET /api/calculations`                            |
| Hardcoded users (`evi/1234`, `nik/5678`) in `Login.jsx` | ⚠️ placeholder                    | **Remove** when wired to API; users move to seeded DB rows (BCrypt-hashed) |
| ESLint flat config                                | ✅ exists                               | Keep; add SonarLint and Vitest                                      |
| Material UI                                       | ✗ not installed                         | Install + theme + per-screen migration                              |
| React Router                                      | ✗ not installed                         | Install; introduce `/login`, `/`, `/history`                        |
| Backend, EF Core, SQL Server, JWT                 | ✗ none                                  | Build from scratch                                                  |
| Workflow + docs (branch-per-story, README + decisions, inline ERD/wireframes, CI) | ✗ none                  | Build from scratch — Gitflow / KanBan / separate Wiki descoped per §11 C7           |
| `_copy`-suffixed duplicate files at repo root     | ⚠️ accidental Windows Explorer copies   | Delete in a small cleanup story                                     |

**Implication for execution:** the work is sequenced as *(a) stabilise foundations, (b) modernise the existing frontend without changing behaviour, (c) build the backend, (d) wire the frontend to the backend and remove the placeholders, (e) test, ship, automate*. See `epics.md` for the per-story breakdown.

---

## 2. Goals & Success Criteria

| #  | Goal                                                                  | Success Criterion                                                                                                          |
|----|-----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| G1 | Authorized users can perform `+`, `-`, `*`, `/` and see the result    | Login flow + 4 operators verified end-to-end against the live backend                                                      |
| G2 | Every calculation is auditable                                        | Each result is persisted with `expression`, `result`, `username`, `createdAt`; visible in History page and queryable in DB |
| G3 | Invalid expressions cannot reach evaluation                           | Server rejects malformed expressions with HTTP 400; client disables submit while invalid                                   |
| G4 | The trainee practices a professional workflow                         | Branch + PR per story file; commits carry story IDs; SonarLint clean; multi-env config without code changes                |
| G5 | The build is reproducible and automated                               | CI pipeline compiles, tests, and packages both apps on every PR to `develop`                                               |
| G6 | Phase 4 AI re-implementation is delivered in a separate repo          | New repo contains a Copilot-assisted rebuild plus a short reflection                                                       |

---

## 3. Personas

- **End user (authorized scripted user)** — signs in with credentials seeded into the database, performs calculations, browses history. Does not manage their own account.
- **Trainee developer (Evi / new teammate)** — owns implementation; needs the work broken into discrete stories to pick up one at a time.
- **Coach engineer** — reviews PRs, mentors on best practices, signs off phases.

---

## 4. Scope

### In scope (from the training brief)
- Login page + Logout
- Calculator (+, -, *, /) with **server-side** evaluation and validation
- Calculations History page with **search by user**
- Persistence of every calculation with timestamp + username
- Multi-environment configuration without code changes
- Unit tests for decoupled units
- CI pipeline (compile, build, package, unit tests)
- ER-Diagram, Wireframes, Wiki
- AI-assisted re-implementation in a new repo (Phase 4)

### Out of scope (explicit)
- User management UI — users are seeded via SQL script ("scripted users")
- Azure PaaS deployment — marked Not Applicable in the brief
- Advanced operators (`%`, `√`, exponents, scientific functions, memory)
- Per-user history isolation — the brief says "search by user", implying cross-user visibility
- Internationalization, dark mode, mobile-native apps
- Real-time / multi-user collaboration

---

## 5. Functional Requirements

| ID  | Requirement                                                                                                       | Source        |
|-----|-------------------------------------------------------------------------------------------------------------------|---------------|
| FR1 | Login page where only authorized users (seeded via SQL) can sign in                                               | Brief §FR3    |
| FR2 | Calculator page supporting `+`, `-`, `*`, `/` and displaying the result                                           | Brief §FR1    |
| FR3 | Every calculation is persisted with `expression`, `result`, `username`, `timestamp`                               | Brief §FR4    |
| FR4 | History page lists previous calculations and supports **search by username**                                      | Brief §FR2    |
| FR5 | Server-side validation rejects expressions that would error (bad chars, division-by-zero, unbalanced parens, empty input) | Brief §FR5    |
| FR6 | Authenticated user can log out, clearing their session                                                            | Brief §FR6    |

---

## 6. Non-Functional Requirements

| ID   | Requirement                                                                  | How we meet it                                                                                                            |
|------|------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| NFR1 | Frontend in React; backend in .NET Core; database via SQL Server             | Stack chosen by the team                                                                                                  |
| NFR2 | Code follows Google Style Guides + best practices                            | `.editorconfig`, ESLint + Prettier (FE, Google JS preset where sensible), Roslyn analyzers (BE)                           |
| NFR3 | "SonarQube for IDE" used during development                                  | SonarLint plugin installed in VS / Rider / VS Code; verified in story 7.4                                                 |
| NFR4 | All source + SQL scripts versioned in Git; one feature branch per story off `main` | Branch convention `feature/<story-id>-<slug>`; PR to `main`; coach review; merge. **No `develop` / `release` / `hotfix` branches** — solo intern workflow (see §11 C7). |
| NFR5 | Every commit traceable to a story file                                       | Story files live under `_bmad-output/implementation-artifacts/`; `sprint-status.yaml` tracks lifecycle; branch + PR title carry the story ID. **Replaces a KanBan board** — solo intern workflow (see §11 C7). |
| NFR6 | Multi-environment configuration without code changes                         | Backend: `appsettings.{Environment}.json`. Frontend: `.env.{mode}` files consumed by Vite                                 |
| NFR7 | Code is decoupled enough for unit tests                                      | Layered backend (Controller → Service → DbContext via EF Core); React presentation components separated from data hooks   |
| NFR8 | An ORM is used for DB interaction                                            | EF Core code-first migrations; raw SQL scripts also committed under `/sql/` to satisfy the brief's "sql scripts" clause   |
| NFR9 | CI pipeline performs compile, build, package, unit tests                     | GitHub Actions workflows on PR to `develop` and on push to `develop`/`main`                                               |

---

## 7. Tech Stack & Architecture

```
┌──────────────────────┐      HTTPS / JSON       ┌──────────────────────┐      EF Core      ┌────────────────┐
│  React + Material UI │ ───────────────────────▶│  ASP.NET Core Web API│ ────────────────▶│  SQL Server    │
│  (Vite, Axios)       │ ◀─── JWT Bearer ────────│  (Controllers + Svcs)│ ◀── migrations ──│  (Users, Calcs)│
└──────────────────────┘                         └──────────────────────┘                   └────────────────┘
```

- **Frontend**: React 19 + Vite + Material UI; Axios for HTTP; React Router; auth state in `localStorage`. Flat structure — `src/pages/` + `src/lib/`. **No Redux / Zustand / form libraries / schema-validation libraries** — see §11 C6.
- **Backend**: ASP.NET Core Web API in **a single project** with folder-based layering (`Controllers/`, `Services/`, `Data/`, `Models/`); JWT Bearer auth; safe expression evaluator (e.g. NCalc or shunting-yard). **No `eval` anywhere. No Clean Architecture / DDD / CQRS / Repository pattern** — see §11 C6.
- **Database**: SQL Server (LocalDB or Docker for dev, full instance for shared envs); EF Core code-first with **data annotations + a single `OnModelCreating`** for the bits annotations can't express; raw SQL scripts also committed under `/sql/`.
- **Cross-cutting**: Multi-env config; structured logging; CORS allow-list per environment.

---

## 8. Data Model

### `Users`
| Column        | Type                  | Notes                                          |
|---------------|-----------------------|------------------------------------------------|
| Id            | INT IDENTITY PK       |                                                |
| Username      | NVARCHAR(50) UNIQUE NOT NULL |                                         |
| PasswordHash  | NVARCHAR(256) NOT NULL | BCrypt or PBKDF2; never plaintext             |
| CreatedAt     | DATETIME2 NOT NULL    | Default `SYSUTCDATETIME()`                     |

### `Calculations`
| Column     | Type                  | Notes                                                                |
|------------|-----------------------|----------------------------------------------------------------------|
| Id         | INT IDENTITY PK       |                                                                      |
| UserId     | INT FK → Users.Id     |                                                                      |
| Username   | NVARCHAR(50) NOT NULL | Denormalized for audit + simpler search by user (FR4)                |
| Expression | NVARCHAR(200) NOT NULL | As entered (post-normalization)                                     |
| Result     | DECIMAL(18,6) NOT NULL | Numeric result                                                       |
| CreatedAt  | DATETIME2 NOT NULL    | Default `SYSUTCDATETIME()`                                           |

Indexes: `IX_Calculations_Username` for the History search filter.

---

## 9. API Surface

| Method | Path                                            | Auth   | Body                       | Response                                                  |
|--------|-------------------------------------------------|--------|----------------------------|-----------------------------------------------------------|
| POST   | `/api/auth/login`                               | none   | `{ username, password }`   | `200 { token, username }` / `401`                         |
| POST   | `/api/auth/logout`                              | bearer | —                          | `204` (no-op for stateless JWT; client clears token)      |
| POST   | `/api/calculations`                             | bearer | `{ expression }`           | `200 { id, expression, result, createdAt, username }` / `400` |
| GET    | `/api/calculations?username=&page=&pageSize=`   | bearer | —                          | `200 { items, total }`                                    |

Username is always read from the JWT `sub` claim, never from the request body.

---

## 10. Phased Delivery

Mapped to the brief's phases:

| Phase | Brief content                                  | This PRD's Epics                                                              |
|-------|------------------------------------------------|-------------------------------------------------------------------------------|
| 1     | Analysis, Design (Wiki, ERD, Wireframes)       | Epic 1 (README + decisions); ERD inline in 4.3; wireframes inline in 3.4/3.5/3.6 |
| 2     | Core Implementation (Git, BE, FE, UTs)         | Epics 3, 4, 5, 6, 7                                                           |
| 3     | CI/CD (Azure deployment skipped — N/A)         | Epic 8                                                                        |
| 4     | AI re-implementation in a new repo             | Epic 9                                                                        |

See `epics.md` for the full epic and story breakdown.

---

## 11. Constraints & Assumptions

- **C1**: The exercise is for a junior developer; complexity must stay approachable, not enterprise-grade.
- **C2**: "Scripted users" = seeded into the database via SQL script; no admin UI.
- **C3**: "Search by user" in History is interpreted as cross-user search by `username` filter, not per-user isolation.
- **C4**: Database is SQL Server, not PostgreSQL as the brief originally stated — team decision.
- **C5**: This is **brownfield** — the existing frontend (see §1.1) is evolved, not rewritten. Migration steps must preserve current behaviour until the backend replacement is in place.
- **C6**: **Plain layered architecture is the complexity ceiling.** Backend = Controller → Service → DbContext (EF Core) inside a **single project**, folder-separated (`Controllers/`, `Services/`, `Data/`, `Models/`). Frontend = `pages/` + `lib/` with props-down state. Explicitly **NOT** introduced: Clean Architecture, DDD aggregates, CQRS / MediatR, Repository pattern, `IEntityTypeConfiguration<T>` classes, DI extension methods, Redux / Zustand / form libraries, schema-validation libraries. This is an intern-led training exercise; revisit only if the brief expands.
- **C7**: **Solo intern descope.** This is a 1-developer exercise (Evi), not a team. Team-process scaffolding from the brief is implemented via the lightest mechanism that preserves the underlying intent:
  - **Gitflow (`develop`/`release`/`hotfix` branches, branch protection)** → one feature branch off `main` per story, PR, coach review, merge.
  - **KanBan board** → story files under `_bmad-output/implementation-artifacts/` + `sprint-status.yaml`.
  - **Separate Wiki / ER-Diagram / Wireframe documents** → README + decisions doc; ERD lives inline in Story 4.3; wireframes live inline in Stories 3.4/3.5/3.6.
  - **Multiple CI workflows + branch-protection story** → one combined CI workflow story (8.1) producing `.github/workflows/backend.yml` + `frontend.yml`; branch protection is a one-click GitHub setting, not a story.
  Revisit only if a real team joins.
- **A1**: Local development uses SQL Server LocalDB or a local instance via Docker.
- **A2**: GitHub Actions is the CI provider.
- **A3**: Authentication uses JWT Bearer tokens; logout is client-side token deletion (stateless server).

---

## 12. Risks & Mitigations

| Risk                                                                   | Impact                | Mitigation                                                                                        |
|------------------------------------------------------------------------|-----------------------|---------------------------------------------------------------------------------------------------|
| Trainee evaluates expressions with `eval()` (security flaw)            | High — code injection | Mandatory: backend uses a safe parser/evaluator (e.g. NCalc or shunting-yard); never `eval`       |
| Plaintext passwords in the seed script                                 | High — credential leak | Seeded passwords are hashed (BCrypt) at seed time; plaintext lives only in the README setup notes |
| Story-to-commit traceability lost                                      | Medium                | Branch + PR title naming convention (`feature/<story-id>-<slug>`); coach reviews each PR before merge |
| Scope creep beyond the brief                                           | Medium                | This PRD is the source of truth; anything outside §4 In-scope is rejected                         |

---

## 13. Open Questions

| #  | Question                                                                         | Owner | Resolve before |
|----|----------------------------------------------------------------------------------|-------|----------------|
| Q1 | JWT lifetime + refresh strategy (15-min access + refresh, or fixed 8h)?          | Coach | Story 4.1      |
| Q2 | Pagination defaults for History (page size 20? 50?)                              | Coach | Story 6.1      |
| Q3 | Confirm: search by user is across all users, not "self only"?                    | Coach | Story 6.1      |
| Q4 | SonarLint only, or also a server-side SonarQube scan in CI?                      | Coach | Story 8.1      |

---

## 14. Glossary

- **Scripted user** — A user seeded into the database via SQL script, not created through any in-app flow.
- **Expression** — A user-entered arithmetic string, e.g. `12 + 4 * (3 - 1)`.
- **Calculation** — The persisted record of an expression and its evaluated result, attributed to a user with a timestamp.
- **Gitflow** — A branching model with long-lived `main` + `develop`, plus short-lived `feature/*`, `release/*`, `hotfix/*` branches. *Descoped here per §11 C7; this PRD uses a single `main` + per-story feature branches.*
- **SonarLint** — IDE plugin (formerly "SonarQube for IDE") that performs local static analysis.
