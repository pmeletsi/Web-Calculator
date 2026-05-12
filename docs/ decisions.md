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

**Consequences.**
(+) Simpler for a SPA.
(−) No server-side revocation list.

## D3 — Server-side expression evaluation

**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Backend uses NCalc (`ExpressionOptions.DecimalAsDefault`); no client `eval`.

**Consequences.**
(+) Security + audit (every calc lives in DB before returning).

## D4 — `%` operator removed

**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** FR2 lists only `+ - * /`. The `%` button is removed from the keypad in Story 3.5.

**Consequences.** Calculator scope tightened.

## D5 — In-repo `docs/` for documentation

**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Documentation lives in `docs/*.md`, not GitHub Wiki.

**Consequences.**
(+) Atomic with code PRs.
(+) No separate repo.

## D6 — Plain layered architecture

**Date:** 2026-05-06 · **Owner:** Coach

**Decision.** Backend = Controller → Service → DbContext (EF Core) inside one project (`backend/WebCalculator.Api/`), folder-separated (`Controllers/`, `Services/`, `Data/`, `Models/`). Frontend = `pages/` + `lib/`, props-down state.

**NOT** introduced: Clean Architecture, DDD aggregates, CQRS / MediatR, Repository pattern, IEntityTypeConfiguration<T> classes, DI extension methods, Redux / Zustand / form libraries / schema-validation libraries.

**Consequences.**
(+) Intern-friendly.
(−) Doesn't scale beyond ~10 endpoints — but PRD §10 doesn't ask it to.

## D7 — Real secrets via User Secrets / env vars

**Date:** TBD (added when Story 4.2 lands) · **Owner:** Coach

**Decision.** Connection strings + JWT keys live in User Secrets (dev) or env vars (prod). Committed JSON has only safe defaults / `REPLACE_VIA_…` sentinels.

**Consequences.**
(+) No secret leak in `git log`.
(−) One-time per-dev setup step.
