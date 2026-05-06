# Story 9.2: Reflection write-up — differences vs. baseline

Status: ready-for-dev

## Story

As **the team**,
I want **a written reflection on the AI-assisted rebuild (Story 9.1) — what Copilot did well, where it misled, how the two implementations compare on quality and time**,
so that **the experiment has a tangible takeaway, the brief's Phase 4 is properly closed, and the trainee internalises the lessons of AI-pair-programming for the next project**.

## Acceptance Criteria

1. `docs/ai-reflection.md` exists in the **new repo** (the one created in Story 9.1).
2. The reflection has these sections, in order:
   - **Executive summary** (≤ 200 words) — answer "would I do it again, and why?"
   - **Where Copilot accelerated work** — at least 3 concrete examples with file + line references and a rough sense of time saved.
   - **Where Copilot misled** — at least 3 concrete examples (wrong API, hallucinated method, insecure suggestion) with how it was caught and the cost.
   - **Quality differences vs. the original** — comparison across at minimum: tests, security, idiomaticity, dead code, architectural drift.
   - **Estimated time delta** — rough hours for the rebuild vs. the original, with a one-line caveat about apples-to-oranges (the original was learning-from-scratch).
   - **Recommendations** — when to lean on Copilot, when to write by hand. Specific to the project's surface area (validators, MUI, JWT, etc.).
3. Source material is `docs/copilot-log.md` (kept up to date in 9.1). Every claim should be backed by a log entry or git commit.
4. The reflection is linked from the new repo's `README.md`.
5. A small `docs/phase-4-completion.md` is added to the **original** repo, noting Phase 4 done and linking to the reflection.
6. Coach reviews and signs off on the reflection.

## Tasks / Subtasks

- [ ] **Task 1 — Re-read the Copilot log** (AC: 3)
  - [ ] Open `docs/copilot-log.md` (from 9.1). If thin, fill in retrospectively from `git log` while memory is fresh — but it's much better to have logged as you went.

- [ ] **Task 2 — Draft each section** (AC: 2)
  - [ ] Use the skeleton in **Dev Notes → Reflection skeleton**.
  - [ ] **Quote your own log** — every claim ("Copilot scaffolded the validator regex in 30 seconds") should be backed by a log entry or commit hash.
  - [ ] Keep it honest: if Copilot was a net win, say so and quantify. If a net loss, same. Likely mixed — be specific about which surface areas were which.

- [ ] **Task 3 — Cross-link from README** (AC: 4)
  - [ ] In the new repo's `README.md`, add: `## Reflection — see [docs/ai-reflection.md](docs/ai-reflection.md).`

- [ ] **Task 4 — Mark Phase 4 complete in the original repo** (AC: 5)
  - [ ] Create `docs/phase-4-completion.md` in the **original** repo per **Dev Notes → Phase-4 marker**.
  - [ ] Update `README.md` (in the original repo) to link it.

- [ ] **Task 5 — Coach review** (AC: 6)
  - [ ] Open a small PR with just `docs/ai-reflection.md` (in the new repo) for coach review.
  - [ ] Iterate based on feedback. Coach signs off in the PR description.

## Dev Notes

### Reflection skeleton

`docs/ai-reflection.md`:

```markdown
# AI-Assisted Rebuild — Reflection

> Written after completing the Phase 4 rebuild of the Web Calculator using GitHub Copilot.
> Original repo: <link>. AI rebuild repo: <this>. Source log: `docs/copilot-log.md`.

## Executive summary

(≤ 200 words. Answer: would you rebuild a project this way again? When yes, when no?
Be opinionated; the coach wants your take, not a hedge.)

## Where Copilot accelerated work

### 1. <topic, e.g. MUI form for Login>
- **File / lines:** `src/pages/Login.jsx:1-60`
- **Commit:** `<sha>`
- **What Copilot did:** typed two TextField + a Button skeleton from a one-line `// MUI form for Login` comment.
- **Time saved:** rough estimate (~30 min vs. hand-writing the form + props).
- **Risk:** what could have gone wrong? (e.g., wrong `type="password"`?) Did anything?

### 2. <topic>
...

### 3. <topic>
...

## Where Copilot misled

### 1. <topic, e.g. wrong EF Core API suggestion>
- **What Copilot suggested:** `db.Users.FirstOrDefaultAsync(...).Result` (sync-over-async)
- **Why it was wrong:** deadlock risk; not the modern pattern for ASP.NET Core.
- **How I caught it:** code review / test failure / type check / docs.
- **Cost:** ~10 min lost rabbit-holing.

### 2. <topic, e.g. eval in the calculator>
...

### 3. <topic, e.g. hardcoded JWT secret>
...

## Quality differences vs. the original

| Area | Original | AI rebuild | Notes |
|---|---|---|---|
| Test count | ~30 | ~?? | ... |
| Test depth | hand-tuned theories (5.1, 7.1) | mostly happy-path | Copilot writes shallow tests by default |
| Security | hardened JWT, no eval | <how it ended up> | ... |
| Dead code | none (TODO markers cleaned by 6.x) | <how it ended up> | ... |
| Architecture | plain layered (PRD C6) | <preserved or drift?> | did `.github/copilot-instructions.md` work? |
| Lines of code (BE) | ~?? | ~?? | (`tokei` or similar) |
| Lines of code (FE) | ~?? | ~?? | |

## Estimated time delta

| | Original | AI rebuild |
|---|---|---|
| Foundation + design (Phase 1) | ~5 days | ~?? hours |
| Core implementation (Phase 2) | ~3 weeks | ~?? days |
| CI/CD (Phase 3) | ~2 days | ~?? hours |
| **Total** | ~?? days | ~?? days |

**Caveat:** the original was learning-from-scratch (decisions had to be made about every architecture choice). The rebuild had a clear PRD + epics blueprint to follow. The delta therefore measures "how much Copilot accelerates *implementation*", not "how much it accelerates a green-field project end-to-end". Treat the numbers as suggestive, not conclusive.

## Recommendations

**Lean on Copilot for:**
- (e.g.) MUI prop sets and form scaffolding — Copilot knows the API surface well.
- (e.g.) Regex sketches — fast first pass; verify edge cases by hand.
- (e.g.) xUnit `[Theory]` skeletons with `[InlineData]` rows.
- (e.g.) ASP.NET Core controller boilerplate.
- ...

**Write by hand:**
- (e.g.) JWT validation parameters (Copilot tends to relax them).
- (e.g.) SQL migrations — review every line.
- (e.g.) Anything security-relevant.
- (e.g.) Architecture decisions (PRD §11 C6 must hold).
- ...

**Always verify:**
- (e.g.) EF Core method signatures against MS Docs (Copilot may suggest pre-EF-Core-8 APIs).
- (e.g.) Package versions in `*.csproj` and `package.json`.
- (e.g.) Async/await correctness — no `.Result` or `.Wait()`.
- ...

## Coach sign-off

Reviewed by: ____________   Date: __________   Signature/initials: ____
```

### Phase-4 marker (in the original repo)

`docs/phase-4-completion.md`:

```markdown
# Phase 4 — AI Re-implementation Complete

**Date:** YYYY-MM-DD
**Trainee:** Evi
**Coach:** ____________

## What was built

A second instance of the Web Calculator, in a new repo, using GitHub Copilot extensively.

- **Repo:** <link to web-calculator-ai>
- **Reflection:** <link to docs/ai-reflection.md in the new repo>
- **Copilot usage log:** <link to docs/copilot-log.md in the new repo>

## TL;DR (from the reflection)

(One-paragraph summary of the trainee's main takeaway.)

## What this closes

- The brief's Phase 4 in `docs/web-calculator-training.md`.
- Story 9.1 (rebuild) and Story 9.2 (reflection) in `_bmad-output/planning-artifacts/epics.md`.
```

### Tone and length

- **Tone:** learning artifact. Honest, evidence-backed. The coach is the audience, not a marketing team.
- **Length:** **3-6 pages of markdown.** Less = under-baked. More = padding.
- **Format hygiene:** real file paths, real commit SHAs, 1-2 lines of code quoted per example. Don't anonymise.

### What "evidence-backed" means

Every claim in the reflection should map to:
- A specific log entry in `docs/copilot-log.md`, OR
- A specific commit hash in the new repo, OR
- A diff between the original and the AI rebuild.

Vague claims like "Copilot was useful" or "Copilot made mistakes" don't pass — they tell the coach nothing they don't already assume.

### What if Copilot was disappointing?

Say so. The most useful reflection is one that **disagrees with the assignment's premise** if the data supports it. "Copilot was a wash on this project because the architecture was already nailed down by the PRD; its strength is open-ended scaffolding which we didn't need." That's a real finding and a credit to the trainee, not a negative.

### Out of scope

- A research paper (this is internal, not academic — no related-work section needed).
- Statistical comparisons (N=1 for both implementations; one trainee).
- Org-wide Copilot policy recommendations (not the trainee's call).
- A demo video or screencast (text-only deliverable).

### Project Structure Notes

- **NEW (in the new repo):** `docs/ai-reflection.md`
- **MODIFY (in the new repo):** `README.md` (add link)
- **NEW (in the original repo):** `docs/phase-4-completion.md`
- **MODIFY (in the original repo):** `README.md` (link the new page)

### References

- [Source: web-calculator-training.md — Phase 4 explicit ask](../../docs/web-calculator-training.md)
- [Source: PRD §10 Phased Delivery](../planning-artifacts/prd.md)
- [Source: epics.md Story 9.2 + upstream 9.1](../planning-artifacts/epics.md)
- GitHub Copilot best practices: https://docs.github.com/en/copilot/using-github-copilot/best-practices-for-using-github-copilot

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
