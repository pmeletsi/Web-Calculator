# Story 7.4: SonarLint baseline clean on FE + BE

Status: ready-for-dev

## Story

As **the team**,
I want **SonarLint reporting zero `Critical` / `Blocker` issues across the BE and FE projects, with documented suppressions where intentional**,
so that **the brief's "Install the SonarQube for IDE and use it while coding locally" requirement is met (PRD NFR3) and the codebase has no obvious quality time-bombs before we wire CI in Epic 8**.

## Acceptance Criteria

1. SonarLint is installed and connected (per Story 1.2 README setup notes) in the IDE the trainee is using.
2. SonarLint scan over `backend/WebCalculator.sln` reports **zero `Critical` / `Blocker` issues**. `Major` and below are acceptable but listed in the PR description.
3. SonarLint scan over `src/` reports **zero `Critical` / `Blocker` issues**. Same `Major`-and-below rule.
4. Any genuine false-positive suppressed inline with a `// nosonar` (BE) or `// eslint-disable-next-line` (FE) comment **plus a one-line reason**. No blanket `nosonar`s.
5. The intentional broad `catch (Exception)` in `CalculationService` (Story 5.4) is annotated with a comment explaining why (defence-in-depth against NCalc edge cases) so SonarLint doesn't flag it as a code smell.
6. The PR description lists every Critical/Blocker that **was** present and how it was fixed (if any) — useful evidence for the coach.

## Tasks / Subtasks

- [ ] **Task 1 — Confirm SonarLint is installed** (AC: 1)
  - [ ] Verify the IDE shows SonarLint findings on a known-bad sample (e.g. add a temporary `var x = 1;` unused variable; SonarLint should mark it; remove the test).
  - [ ] If not installed: follow the README "Getting started" section (Story 1.2).

- [ ] **Task 2 — Backend scan + cleanup** (AC: 2, 5)
  - [ ] Open `backend/WebCalculator.sln` in your IDE.
  - [ ] Filter SonarLint findings to **Severity: Critical or Blocker**.
  - [ ] For each:
    - **Real issue?** Fix it (small, focused commit).
    - **False positive?** Annotate with `// nosonar — <one-line reason>`.
  - [ ] Annotate the broad `catch (Exception)` in `CalculationService.CalculateAsync` per **Dev Notes → Annotated catch**.

- [ ] **Task 3 — Frontend scan + cleanup** (AC: 3)
  - [ ] Open `src/` in your IDE.
  - [ ] Same workflow: Critical/Blocker only, fix or suppress with reason.

- [ ] **Task 4 — Document findings in the PR** (AC: 4, 6)
  - [ ] PR description: a small table per project (`What`, `Severity`, `Action`, `Reason if suppressed`).

- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/7.4-sonarlint-clean`

## Dev Notes

### What this story is and isn't

- **Is:** a focused cleanup pass — SonarLint findings, sorted by severity, addressed top-down.
- **Isn't:** a full refactor or stylistic rewrite. The PRD §11 C6 ceiling stands. Keep it boring.

### Common categories you'll likely see (and how to handle)

| Source | Pattern | Action |
|---|---|---|
| BE | "Catch a more specific exception" on the `catch (Exception)` in `CalculationService` | Suppress with comment (intentional — see Annotated catch) |
| BE | "Magic number" on `60` in `Jwt:LifetimeMinutes` fallback | Either extract to a `const` or suppress (it's a default, not a magic number) |
| BE | "Use `nameof`" on string literals for parameter names | Trivial fix — apply |
| BE | "Method too complex" — usually a sign of a missed extract | Extract a private helper; **don't** introduce a new layer |
| BE | "Missing async cancellation token" | Already passing `CancellationToken` everywhere; should be 0 hits |
| FE | "Use semantic HTML" / accessibility nudges | Most are false positives on MUI components — suppress with one-line reason |
| FE | "Unused variable" in tests (e.g. `_` for unused arg) | Rename to `_unused` or suppress |
| FE | "Avoid `localStorage`" (security warning) | Suppress with reason — JWT-in-localStorage is a documented choice (D2 + 6.1) |
| FE | "Function too long" on Calculator's `handleCalculate` | Extract a small helper if useful; otherwise suppress |
| FE | "Missing key prop" on the `keys.map` in Calculator | Already keyed by index — confirm; if the warning persists, refactor to use a stable key |

### Annotated catch

In `backend/WebCalculator.Api/Services/CalculationService.cs`, on the `catch` line in `CalculateAsync`:

```csharp
try
{
    var ncalc = new NCalc.Expression(expression, NCalc.ExpressionOptions.DecimalAsDefault);
    result = Convert.ToDecimal(ncalc.Evaluate());
}
catch (Exception)  // nosonar — defence in depth: NCalc may throw on overflow / shapes the validator missed; we convert to 400 instead of letting a 500 leak.
{
    return (ValidationResult.Fail(ValidationReason.BadCharacter, "Expression could not be evaluated."), null);
}
```

### Suppression syntax cheat sheet

- **C# / SonarLint:** trailing `// nosonar — <reason>` on the offending line.
- **Strict SonarAnalyzer attribute (more formal):** `[System.Diagnostics.CodeAnalysis.SuppressMessage("Sonar", "S1234", Justification = "…")]` — overkill for an intern project. Inline `// nosonar` is fine.
- **JS / TS:** `// eslint-disable-next-line <rule-id>` immediately above the line. (SonarLint for JS surfaces in the same channel.)
- **JSX expression:** `{/* eslint-disable-next-line react/<rule-id> */}` placed on its own line above the offending JSX.

### What if there are 50+ Critical/Blocker findings?

That would be surprising — the codebase is small and intern-shaped. If it happens:
1. Don't panic. Skim the categories.
2. Many will repeat (e.g. "use nameof" × 10) — fix with find-replace.
3. A few will be MUI/React idioms SonarLint doesn't recognise — suppress with reason.
4. If a single category dwarfs everything else, ask the coach before mass-suppressing — there may be a real refactor to do.

### Why no server-side SonarQube scan in this story

PRD Open Question Q4 (server-side SonarQube in CI) is deferred to Story 8.1. This story is **IDE-only**, matching the brief's literal text ("Install the SonarQube for IDE and use it while coding locally").

### Out of scope

- Server-side SonarQube setup (PRD Q4 / possibly Story 8.1).
- ESLint rule-set overhaul — current flat config is fine.
- Stylistic preferences (formatting, naming) unless flagged Critical.

### Project Structure Notes

- **MODIFY (typically):** small inline changes scattered across BE + FE files. The PR diff should be small if the codebase is healthy.
- **NEW:** none.

### References

- [Source: PRD §6 NFR3; §11 C6; §13 Q4](../planning-artifacts/prd.md)
- [Source: epics.md Story 7.4 + upstream 7.1, 7.3](../planning-artifacts/epics.md)
- [Source: Story 1.2 — SonarLint install in README setup](./1-2-readme-and-setup.md)
- SonarLint: https://www.sonarsource.com/products/sonarlint/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
