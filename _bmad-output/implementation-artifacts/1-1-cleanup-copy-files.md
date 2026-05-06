# Story 1.1: Clean up accidental `_copy` duplicate files

Status: ready-for-dev

## Story

As **the team**,
I want **the seven accidental Windows-Explorer `_copy` files at the repo root deleted**,
so that **the repo is unambiguous and contributors don't accidentally edit the wrong file**.

## Acceptance Criteria

1. The following seven files are removed from the repo (deleted from the working tree **and** from Git):
   - `.gitignore copy`
   - `package copy.json`
   - `package-lock copy.json`
   - `vite.config copy.js`
   - `eslint.config copy.js`
   - `index copy.html`
   - `README copy.md`
2. After the deletion, `git status` is clean and reports no other unexpected changes.
3. The frontend still builds: `npm install && npm run build` succeeds with **no new warnings or errors** caused by this change.
4. The frontend still runs in dev: `npm run dev` starts and `http://localhost:5173` renders the existing UI exactly as before.

## Tasks / Subtasks

- [ ] **Task 1 — Confirm files exist and are tracked by Git** (AC: 1)
  - [ ] PowerShell: `git ls-files | Select-String "copy"`
  - [ ] Bash: `git ls-files | grep -i ' copy'`
  - [ ] Expect exactly the 7 files listed in AC 1. If a file is missing, double-check spelling. If extra files appear, **stop** and consult the coach.

- [ ] **Task 2 — Delete via `git rm`** (AC: 1)
  - [ ] PowerShell (filenames have spaces — quoting matters):
    ```powershell
    git rm '.gitignore copy' 'package copy.json' 'package-lock copy.json' 'vite.config copy.js' 'eslint.config copy.js' 'index copy.html' 'README copy.md'
    ```
  - [ ] Bash equivalent:
    ```bash
    git rm ".gitignore copy" "package copy.json" "package-lock copy.json" "vite.config copy.js" "eslint.config copy.js" "index copy.html" "README copy.md"
    ```
  - [ ] **Do not** use `rm` / `Remove-Item` directly — `git rm` stages the deletion and keeps Git in sync.

- [ ] **Task 3 — Verify the build still works** (AC: 3)
  - [ ] `npm install`
  - [ ] `npm run build` → expect exit code 0; the `dist/` folder is produced.

- [ ] **Task 4 — Verify the dev server still works** (AC: 4)
  - [ ] `npm run dev`
  - [ ] Open `http://localhost:5173` → see the existing Login page; log in (e.g. `evi` / `1234`) → see Calculator → click `History` → see History view. No regressions.
  - [ ] Stop the dev server.

- [ ] **Task 5 — Confirm `git status` is clean** (AC: 2)
  - [ ] `git status` should show only the seven `D` (deleted) staged entries from Task 2 — no untracked files, no modified files except those.

- [ ] **Task 6 — Commit and open the PR** (AC: all)
  - [ ] Branch: `feature/1.1-cleanup-copy-files`
  - [ ] Commit: `[1.5] Remove accidental _copy duplicate files`
  - [ ] PR title: `[Story 1.1] Remove accidental _copy duplicate files`
  - [ ] PR description: list the 7 files removed and a screenshot showing `npm run build` succeeded.

## Dev Notes

### Why these files exist

Per `CLAUDE.md` ("Repo quirks"), these are accidental Windows Explorer "copy" duplicates — not vendored snapshots, not backup branches. They were almost certainly created by selecting a file in Explorer and pressing Ctrl+C / Ctrl+V at the same level. The un-suffixed files are authoritative.

### Files verified at the repo root (2026-05-06)

```
.gitignore copy
README copy.md
eslint.config copy.js
index copy.html
package copy.json
package-lock copy.json
vite.config copy.js
```

Total: **7 files**. All at the repo root (not nested).

### Why this is the safest first commit

- Pure deletion — no logic changes, no merge risk.
- The active config (un-suffixed files) is untouched.
- Easy to verify: build + dev server before / after.
- A great first PR for the trainee to walk through the workflow (`feature/<story-id>-<slug>` off `main` → PR → coach review → merge — see PRD §11 C7).

### Rollback

If anything looks wrong after the merge:
```
git revert <commit-sha>
```
Recovers the deleted files instantly because they live in Git history.

### Non-goals — DO NOT delete

These files are intentional and stay:
- `_bmad/`, `_bmad-output/` — BMad tooling and artifacts (this story file lives there).
- `.agents/`, `.claude/`, `.tmp/` — agent scaffolding.
- `CLAUDE.md` — project instructions for AI agents.
- Any folder under `docs/` (Greek-named XLSX files included — internship paperwork).

If in doubt about a file, **leave it and ask the coach**.

### Out of scope

- Editing `.gitignore` to prevent future `_copy` files from being added (could be a follow-up — for now coach PR review is the safety net).
- Renaming or restructuring any other files.

### Project Structure Notes

- **DELETE (7):** `.gitignore copy`, `package copy.json`, `package-lock copy.json`, `vite.config copy.js`, `eslint.config copy.js`, `index copy.html`, `README copy.md`
- **NEW:** none
- **MODIFY:** none

### References

- [Source: epics.md Story 1.1](../planning-artifacts/epics.md)
- [Source: CLAUDE.md "Repo quirks"](../../CLAUDE.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
