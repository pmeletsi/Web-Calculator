# Story 9.1: New repo + recreate backend & frontend with GitHub Copilot

Status: ready-for-dev

## Story

As **a junior developer completing the brief's Phase 4**,
I want **to recreate the entire web calculator in a fresh Git repo using GitHub Copilot extensively (autocomplete, chat, `/tests`, `/explain`)**,
so that **I learn how AI-assisted development changes pace, quality, and decision-making — and produce a second working instance of the same app for comparison in the Story 9.2 reflection**.

## Acceptance Criteria

1. A new Git repo exists (e.g. `web-calculator-ai`) — separate from the original.
2. The new repo's `README.md` links to the **original** repo's PRD + epics as the authoritative spec.
3. Same workflow as the original (PRD §11 C7): single `main` branch, one feature branch per story off `main`, PR-and-merge — no `develop` / `release` / `hotfix` branches.
4. All six FRs (PRD §5) are implemented and verifiable end-to-end:
   - **FR1** Login with seeded BCrypt users (same `evi`/`1234`, `nik`/`5678` as original).
   - **FR2** Calculator with `+ - * /` (no `%`, no client `eval`).
   - **FR3** Persistence with `username` + `timestamp` per calc.
   - **FR4** History page with search-by-user + pagination.
   - **FR5** Server-side validation (`ExpressionValidator` equivalent).
   - **FR6** Logout that clears the JWT.
5. Same architecture as the original (PRD §11 C6 — plain layered, single BE project, no Clean Arch / DDD / CQRS / Repository pattern).
6. Basic CI workflows in place (one BE, one FE) — does **not** need to match Story 8.1 line-for-line; "build + test on PR" is enough.
7. A running log at `docs/copilot-log.md` records, per session or per commit, what Copilot was used for, what was accepted, what was rejected, and any wrong/hallucinated suggestions caught.
8. The app runs locally end-to-end (login → calc → history → logout) — same behaviour as the original.

## Tasks / Subtasks

- [ ] **Task 1 — Verify Copilot access** (Prereq)
  - [ ] Confirm GitHub Copilot subscription is active in your IDE (VS / Rider / VS Code).
  - [ ] If you don't have access: GitHub Copilot is **free for verified students** — apply at https://education.github.com/.
  - [ ] Coach can also assign a seat from the org plan.

- [ ] **Task 2 — Create the new repo** (AC: 1, 3)
  - [ ] Create empty repo on GitHub: `web-calculator-ai` (or coach-chosen name). Don't use a template.
  - [ ] Clone locally, somewhere outside the original repo.
  - [ ] Set up the basics: `.gitignore` (Vite + .NET ignores), `.github/pull_request_template.md` (one section: "Story" pointing to the original repo's story file). **No** `develop` branch, **no** branch protection — solo workflow per PRD §11 C7.
  - [ ] **Lever:** let Copilot autocomplete the `.gitignore` and PR template — these are perfect Copilot fodder.

- [ ] **Task 3 — Write the new README** (AC: 2)
  - [ ] Project overview (one paragraph: "AI-assisted rebuild of the original web calculator — see…").
  - [ ] **Authoritative spec links** to the original repo's:
    - `_bmad-output/planning-artifacts/prd.md`
    - `_bmad-output/planning-artifacts/epics.md`
    - `docs/web-calculator-training.md`
  - [ ] Section "How this differs from the original — built with GitHub Copilot. See `docs/copilot-log.md` and `docs/ai-reflection.md` (Story 9.2)."
  - [ ] Local-setup quick-start (Node 20+, .NET 8, SQL Server LocalDB or Docker).

- [ ] **Task 4 — (Optional but recommended) Add `.github/copilot-instructions.md`** (AC: 5, 7)
  - [ ] Create `.github/copilot-instructions.md` with the cross-cutting context per **Dev Notes → Copilot instructions file**.
  - [ ] This file is read automatically by Copilot Chat — boosts suggestion quality, reduces architectural drift.

- [ ] **Task 5 — Initialise the Copilot log** (AC: 7)
  - [ ] Create `docs/copilot-log.md` with the headers from **Dev Notes → Log template**.
  - [ ] Update it as you go — every session (or every "interesting" commit). Don't backfill from memory at the end; the data degrades fast.

- [ ] **Task 6 — Rebuild in this order** (AC: 4, 5, 6, 8)
  - [ ] Use the rebuild plan in **Dev Notes → Rebuild order** as your checklist. Each row maps to a feature; tick when working + the corresponding tests pass.

- [ ] **Task 7 — End-to-end smoke** (AC: 8)
  - [ ] Login with `evi` / `1234` → calculator → submit `(1+2)*3` → result `9` → navigate to `/history` → see the row.
  - [ ] Logout → back to login screen.
  - [ ] BE + FE tests run locally; CI green on at least one PR.

- [ ] **Task 8 — Mark feature-complete**
  - [ ] In the new repo's `README.md`, add a "Status" badge or line: "Phase 4 rebuild complete YYYY-MM-DD."
  - [ ] Story 9.2 (reflection) starts immediately after — easier while everything is fresh.

## Dev Notes

### Why Phase 4 exists

The brief is explicit: "When the web calculator is complete, recreate it in a new Git repository, leveraging GitHub Copilot to the fullest." The point is **comparative learning**, not throw-away code. By the end of this story you'll know:
- Where Copilot accelerates you (boilerplate, MUI prop sets, repetitive tests, scaffolding).
- Where Copilot misleads you (deprecated APIs, wrong package names, hallucinated methods, insecure defaults).
- When to accept and when to write by hand.

Story 9.2 turns those observations into a written reflection.

### Rebuild order (use as a checklist)

This mirrors Epics 1-8 but condensed — the architecture is already proven, so the second pass should be much faster.

| # | Feature | Original story | Copilot lever to try |
|---|---|---|---|
| 1 | Repo + `.gitignore` + README + PR template | 1.3, 1.5 | Autocomplete `.gitignore` (Vite + .NET), PR template body |
| 2 | Decisions doc (D1-D7 copy-over) | 1.3 | Chat: "Summarise these 7 decisions in a docs/decisions.md page" |
| 3 | .NET solution scaffold | 4.1 | `dotnet new` is hand-CLI; Chat for project-reference graph |
| 4 | EF Core + DbContext + entities | 4.2, 4.3 | Autocomplete the entity classes from a one-line comment |
| 5 | DataSeeder | 4.4 | Chat: "Write a BCrypt-hashing seeder for two users" |
| 6 | ExpressionValidator + xUnit tests | 5.1, 7.1 | Autocomplete the regex set; Chat `/tests` for the validator |
| 7 | Auth (login + JWT + middleware) | 5.2, 5.3 | Hand-write JWT issuance — Copilot's first suggestions tend to skip claim hardening |
| 8 | CalculationsController + service | 5.4, 5.5 | Copilot writes the controller pattern in seconds |
| 9 | React + MUI + Router scaffold | 3.1, 3.2 | Autocomplete; Chat: "wrap App in ThemeProvider + AuthProvider" |
| 10 | Login page (MUI) | 3.3, 6.2 | Autocomplete the form is fast |
| 11 | Calculator page (MUI keypad) | 3.4, 6.3 | Generate the keypad array from a one-line comment |
| 12 | History page (MUI Table + paging) | 3.5, 6.4 | Autocomplete the table; **verify pagination math by hand** |
| 13 | Vitest + RTL tests | 7.3 | Chat: `/tests` for each page |
| 14 | CI workflows | 8.1 | Generate `backend.yml` + `frontend.yml` from a comment |

### Log template

`docs/copilot-log.md`:

```markdown
# Copilot usage log

Goal: track where AI helped, where it hurt, what suggestions had to be discarded.
Used as input for `docs/ai-reflection.md` (Story 9.2).

## Convention

For each session or noteworthy commit:

### YYYY-MM-DD — short topic
- **Files touched:** ...
- **Copilot mode:** [autocomplete | chat | /tests | /explain | /fix]
- **Accepted:** what suggestions I kept (1-line each)
- **Rejected:** what I discarded and why
- **Bugs from suggestions:** anything wrong I caught (or didn't, until tests broke)
- **Time spent:** rough estimate (used for the reflection)

---

### 2026-05-XX — Repo bootstrap
- ...
```

### Copilot instructions file (recommended)

`.github/copilot-instructions.md`:

```markdown
# Copilot instructions for the Web Calculator (AI rebuild)

Authoritative spec: see the **original** repo's `_bmad-output/planning-artifacts/prd.md` and `epics.md`.

## Architecture (do not deviate)
- **Backend:** ASP.NET Core 8 Web API in a SINGLE project (`backend/WebCalculator.Api/`).
  Folder layering: `Controllers/`, `Services/`, `Data/`, `Models/`. No Clean Architecture, no DDD,
  no Repository pattern, no IEntityTypeConfiguration<T> files, no DI extension methods.
- **Frontend:** React 19 + Vite + Material UI. `src/pages/` + `src/lib/`. No Redux/Zustand/form libs.
- **Auth:** JWT Bearer (HS256), stateless logout. Username always read from JWT `sub` claim.
- **Validation:** server-side via a regex+balanced-parens validator. NEVER `eval` on the client.
- **Persistence:** EF Core code-first. Data annotations + a single `OnModelCreating`. SQL Server.

## Coding standards
- BCrypt for password hashing (BCrypt.Net-Next).
- NCalc with `ExpressionOptions.DecimalAsDefault` for evaluation.
- xUnit + EF InMemory provider for backend tests.
- Vitest + RTL for frontend tests.

## Out of scope (do not suggest)
- The `%` operator on the calculator (FR2 only allows + - * /).
- `eval()` anywhere in the React app.
- Plaintext passwords in source.
- Redux, Zustand, React Query, Formik, React Hook Form, Yup, Zod.
- Domain / Infrastructure project separation.
```

### Commit-message tagging convention

Tag each commit so the diff is searchable later:

```
[1.1][copilot:full]      Add .gitignore and PR template
[5.4][copilot:assisted]  CalculationService — Copilot scaffold, fixed BCrypt path
[5.2][copilot:none]      AuthService — wrote JWT issuance by hand
```

Categories:
- `copilot:full` — accepted Copilot's suggestion almost verbatim
- `copilot:assisted` — used Copilot but rewrote significant parts
- `copilot:none` — wrote by hand (Copilot off, or rejected all suggestions)

### Common Copilot pitfalls (heads-up)

- **Wrong package versions** — Copilot may suggest `Microsoft.EntityFrameworkCore.SqlServer` 6.x. Pin 8.x.
- **Deprecated ASP.NET startup pattern** — old `Startup.cs` style. Use minimal hosting (Story 4.1's `Program.cs`).
- **Insecure JWT defaults** — Copilot sometimes suggests skipping `ValidateIssuer` / `ValidateAudience`. Don't.
- **`eval` in the JS calculator** — Copilot autocomplete loves `eval`. **Reject every time.** Server-side eval only.
- **Test fixtures that don't compile** — Copilot's xUnit `[Fact]` skeletons sometimes use the wrong namespace. Verify.
- **Hallucinated NCalc methods** — `Expression.EvaluateAsync` doesn't exist on all versions; verify.
- **Hardcoded secrets in suggestions** — Copilot may suggest a literal JWT key. Use User Secrets / env vars (D7).

### What NOT to do

- **Don't re-run BMad planning.** The original PRD + epics are the spec.
- **Don't redesign architecture.** PRD §11 C6 still applies. No Clean Arch sneaking in via Copilot suggestions.
- **Don't accept hallucinations silently.** If Copilot suggests an EF Core method that doesn't exist in 8.x, either correct from MS Docs or reject. Log it.
- **Don't skip the log.** Without `docs/copilot-log.md`, Story 9.2 becomes a vague memory exercise.

### Out of scope

- A formal CI pipeline matching Story 8.1 line-for-line (any working CI is fine).
- ER-Diagram + wireframes (use the originals; link from new repo's README).
- Production-grade Sonar / coverage gates.
- The reflection write-up itself (Story 9.2).

### Project Structure Notes

This story produces an **entire new repo**, not edits to the current one. Final state of the new repo:

```
web-calculator-ai/
├── .github/
│   ├── workflows/{backend,frontend}.yml
│   ├── pull_request_template.md
│   └── copilot-instructions.md   (optional, recommended)
├── .gitignore
├── README.md
├── backend/...                    (same shape as the original)
├── src/...                        (same shape as the original)
├── docs/
│   ├── copilot-log.md             ← grows as you go
│   └── ai-reflection.md           ← Story 9.2 produces this
└── sql/001_create_schema.sql
```

### References

- [Source: web-calculator-training.md — Phase 4](../../docs/web-calculator-training.md)
- [Source: PRD §5 FRs, §10 Phase 4 mapping, §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md — full backlog as the spec](../planning-artifacts/epics.md)
- GitHub Copilot for students: https://education.github.com/pack
- Copilot best practices: https://docs.github.com/en/copilot/using-github-copilot/best-practices-for-using-github-copilot
- Copilot custom instructions: https://docs.github.com/en/copilot/customizing-copilot/about-customizing-github-copilot-chat-responses

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
