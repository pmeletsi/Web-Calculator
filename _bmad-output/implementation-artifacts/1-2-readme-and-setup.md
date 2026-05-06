# Story 1.2: Project README + setup notes + decisions log

Status: ready-for-dev

## Story

As **Evi (the trainee)** and **the coach reviewing PRs**,
I want **a clear `README.md` explaining what this project is and how to run it locally, plus a small `docs/decisions.md` capturing the architectural choices**,
so that **anyone opening the repo is productive in minutes — and the rationale behind D1-D7 isn't lost in chat history**.

## Acceptance Criteria

1. `README.md` is rewritten (current content is the default Vite template — no project info to preserve). It contains:
   - Project title + one-paragraph overview.
   - Tech stack (React 19 + MUI · ASP.NET Core 8 + EF Core · SQL Server).
   - "Getting started" with prerequisite install steps (.NET 8 SDK, Node 20+, SQL Server LocalDB or Docker, SonarLint IDE plugin).
   - Verification checklist (5 lines: `dotnet --version`, `node -v`, `npm -v`, LocalDB ping, SonarLint shows issues).
   - Run instructions (`npm run dev` for FE, `dotnet run --project backend/WebCalculator.Api` for BE).
   - Link to PRD + epics + decisions.
   - Branching convention: simple `feature/<story-id>-<slug>` off `main`.
2. `docs/decisions.md` exists, listing decisions D1-D6 in **Context / Decision / Consequences** format. D7 (User Secrets) lands when Story 4.2 is done.
3. The 7 `_copy` files (Story 1.1) are addressed in a separate PR — this story does NOT touch them.
4. **No** separate Wiki structure (descoped per PRD §11 C7).

## Tasks / Subtasks

- [ ] **Task 1 — Rewrite `README.md`** (AC: 1)
  - [ ] Use the skeleton in **Dev Notes → README skeleton**.

- [ ] **Task 2 — Create `docs/decisions.md`** (AC: 2)
  - [ ] Use the format in **Dev Notes → Decisions log**.
  - [ ] Seed D1-D6 now. D7 added when Story 4.2 is done.

- [ ] **Task 3 — Verify the install steps on a clean machine**
  - [ ] Either provision a fresh user/VM or have a teammate walk through.
  - [ ] Fix any missing/wrong step.

- [ ] **Task 4 — Open the PR**
  - [ ] Branch: `feature/1.2-readme-and-setup`

## Dev Notes

### README skeleton

````markdown
# Web Calculator

PwC junior-developer training exercise — a web calculator with login, history, and full implementation discipline (multi-env config, unit tests, CI).

- **Frontend:** React 19 + Vite + Material UI
- **Backend:** ASP.NET Core 8 + EF Core *(in progress)*
- **Database:** SQL Server *(in progress)*

Authoritative spec: [PRD](_bmad-output/planning-artifacts/prd.md) · [Epics + serial roadmap](_bmad-output/planning-artifacts/epics.md) · [Decisions](docs/decisions.md)

## Getting started

### Prerequisites
- **.NET 8 SDK** — Windows: `winget install Microsoft.DotNet.SDK.8` · macOS: `brew install --cask dotnet-sdk`
- **Node 20+** — Windows: `winget install OpenJS.NodeJS.LTS` · macOS: `brew install node@20`
- **SQL Server** — Windows LocalDB (bundled with VS) or Docker:
  ```
  docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Y0urStrong!Passw0rd" -p 1433:1433 -d --name webcalc-mssql mcr.microsoft.com/mssql/server:2022-latest
  ```
- **SonarLint** IDE plugin (VS / Rider / VS Code) — standalone mode is fine.

### Verify install
- [ ] `dotnet --version` → 8.x.x
- [ ] `node -v` → ≥ 20.0.0  ·  `npm -v` → ≥ 10
- [ ] `sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "SELECT 1"` returns `1`  *(LocalDB)*
- [ ] SonarLint shows issues in the IDE Problems panel

### Run

```bash
# Frontend
npm install
npm run dev         # http://localhost:5173

# Backend (after Story 4.1)
dotnet run --project backend/WebCalculator.Api   # http://localhost:5000
```

## Branching

Solo workflow:
- All work on `feature/<story-id>-<slug>` branches off `main` (e.g. `feature/3.1-install-mui`).
- One PR per story. Coach reviews. Merge to `main`.
- No long-lived `develop` / `release` / `hotfix` branches — see PRD §11 C7.

## Tracking

Stories live as files under `_bmad-output/implementation-artifacts/`. Status tracked in `sprint-status.yaml`:
- `ready-for-dev` — written, ready to pick up
- `in-progress` — active development
- `done` — merged to `main`

Pick the next story per the **serial roadmap** at the top of `_bmad-output/planning-artifacts/epics.md`.
````

### Decisions log

`docs/decisions.md`:

```markdown
# Architecture Decisions

Each entry: **Context / Decision / Consequences**. Numbered for easy reference (e.g. "see D3").

---

## D1 — SQL Server over PostgreSQL
**Date:** 2026-05-06 · **Owner:** Coach

**Context.** Brief specifies PostgreSQL. Team has stronger .NET experience.

**Decision.** Use SQL Server. Local dev = LocalDB or Docker.

**Consequences.**
- (+) EF Core has first-class SQL Server support.
- (−) Diverges from brief; documented and accepted.
- (−) LocalDB is Windows-only.

## D2 — JWT Bearer auth over session cookies
**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Use JWT (HS256). Logout = client-side token deletion (server is stateless).

**Consequences.** (+) Simpler for a SPA. (−) No server-side revocation list.

## D3 — Server-side expression evaluation
**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Backend uses NCalc (`ExpressionOptions.DecimalAsDefault`); no client `eval`.

**Consequences.** (+) Security + audit (every calc lives in DB before returning).

## D4 — `%` operator removed
**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** FR2 lists only `+ - * /`. The `%` button is removed from the keypad in Story 3.5.

**Consequences.** Calculator scope tightened.

## D5 — In-repo `docs/` for documentation
**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Documentation lives in `docs/*.md`, not GitHub Wiki.

**Consequences.** (+) Atomic with code PRs. (+) No separate repo.

## D6 — Plain layered architecture
**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Backend = Controller → Service → DbContext (EF Core) inside one project (`backend/WebCalculator.Api/`), folder-separated (`Controllers/`, `Services/`, `Data/`, `Models/`). Frontend = `pages/` + `lib/`, props-down state.

**NOT** introduced: Clean Architecture, DDD aggregates, CQRS / MediatR, Repository pattern, IEntityTypeConfiguration<T> classes, DI extension methods, Redux / Zustand / form libraries / schema-validation libraries.

**Consequences.** (+) Intern-friendly. (−) Doesn't scale beyond ~10 endpoints — but PRD §10 doesn't ask it to.

## D7 — Real secrets via User Secrets / env vars
**Date:** TBD (added when Story 4.2 lands) · **Owner:** Coach

**Decision.** Connection strings + JWT keys live in User Secrets (dev) or env vars (prod). Committed JSON has only safe defaults / `REPLACE_VIA_…` sentinels.

**Consequences.** (+) No secret leak in `git log`. (−) One-time per-dev setup step.
```

### Out of scope

- The 7 `_copy` files (Story 1.1).
- Frontend or backend coding (Stories 3.x and 4.x onward).
- Wiki structure with 6 pages (descoped per PRD §11 C7).
- Gitflow long branches (descoped — solo intern, single `main` + feature branches).
- KanBan board with 38 cards (descoped — `sprint-status.yaml` + story files are the kanban).

### Project Structure Notes

- **MODIFY:** `README.md` (full rewrite — current is default Vite template).
- **NEW:** `docs/decisions.md`.

### References

- [Source: PRD §1.1 (brownfield), §11 C6, C7](../planning-artifacts/prd.md)
- [Source: epics.md serial roadmap](../planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
