## D7 — Real secrets via User Secrets / env vars, never committed JSON

**Date:** 2026-05-29 · **Owner:** Coach

**Context.** PRD NFR6 requires multi-env config without code changes; the brief also requires we never leak credentials in source.

**Decision.** Committed `appsettings.{Env}.json` files contain only safe defaults (LocalDB Windows auth) or placeholders (`REPLACE_VIA_ENVVAR_OR_USER_SECRETS`). Real secrets live in:

- **Dev:** `dotnet user-secrets` (per-developer, not committed)
- **Production:** environment variables (e.g. `ConnectionStrings__Default=...`)

**Consequences.**

- (+) No accidental secret leak in `git log`.
- (+) `dotnet user-secrets list` is the canonical place to find what each dev is overriding.
- (−) An extra setup step for new contributors (covered in the README "Getting started" section, Story 1.2).
