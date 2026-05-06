# Story 8.1: CI workflow (BE + FE)

Status: ready-for-dev

## Story

As **the team**,
I want **two GitHub Actions workflows — one for the backend, one for the frontend — that build and test on every PR to `main` and on every push to `main`**,
so that **broken builds are caught before the coach reviews the PR (PRD NFR9) — keeping the brief's CI requirement satisfied without enterprise team-coordination ceremony (PRD §11 C7)**.

## Acceptance Criteria

1. `.github/workflows/backend.yml` exists. On `pull_request` to `main` and `push` to `main`:
   - Setup .NET 8 → restore → build (Release) → test → publish.
   - Coverage uploaded as artifact `coverage-backend`.
   - Publish output uploaded as artifact `webcalculator-api`.
2. `.github/workflows/frontend.yml` exists. On `pull_request` to `main` and `push` to `main`:
   - Setup Node 20 + npm cache → `npm ci` → lint → test → build.
   - `dist/` uploaded as artifact `webcalculator-frontend`.
3. Both workflows use `concurrency.cancel-in-progress: true`.
4. Both workflows green on the current `main` HEAD (verify via no-op PR or trivial commit).
5. **No branch protection rules.** Solo intern; coach manually verifies CI green before merging (PRD §11 C7 — no team to enforce against).

## Tasks / Subtasks

- [ ] **Task 1 — Create `.github/workflows/backend.yml`** (AC: 1, 3)
  - [ ] Use the snippet in **Dev Notes → backend.yml**.

- [ ] **Task 2 — Create `.github/workflows/frontend.yml`** (AC: 2, 3)
  - [ ] Use the snippet in **Dev Notes → frontend.yml**.

- [ ] **Task 3 — Verify** (AC: 4)
  - [ ] Branch: `feature/8.1-ci-workflow`. Push.
  - [ ] Open a draft PR against `main`. Both workflows kick off; wait for green.
  - [ ] Confirm the **Actions** tab shows both succeeded.
  - [ ] Confirm artifacts downloadable from the run summary.

- [ ] **Task 4 — Open the PR (real, not draft)**
  - [ ] Convert draft → ready for review. Coach merges.

## Dev Notes

### `backend.yml`

`.github/workflows/backend.yml`:

```yaml
name: backend

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: backend-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-test-package:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.x'

      - run: dotnet restore backend/WebCalculator.sln
      - run: dotnet build backend/WebCalculator.sln --configuration Release --no-restore
      - run: |
          dotnet test backend/WebCalculator.sln \
            --configuration Release \
            --no-build \
            --collect:"XPlat Code Coverage" \
            --results-directory ./TestResults

      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-backend
          path: TestResults/**/coverage.cobertura.xml

      - run: dotnet publish backend/WebCalculator.Api -c Release -o ./publish --no-build

      - uses: actions/upload-artifact@v4
        with:
          name: webcalculator-api
          path: ./publish
```

### `frontend.yml`

`.github/workflows/frontend.yml`:

```yaml
name: frontend

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: frontend-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build

      - uses: actions/upload-artifact@v4
        with:
          name: webcalculator-frontend
          path: dist/
```

### Why two files instead of one matrix job

Two files are easier to read; one failing pipeline doesn't visually mask the other. Both are tiny — ~30 lines each. The `concurrency` block keeps CI minute spend bounded.

### Why no branch protection

PRD §11 C7: solo intern. There's no team to protect `main` from. The coach manually checks Actions is green before merging — same outcome, zero config.

If a real team forms later, a 5-minute UI click in **Settings → Branches → Add rule** turns on "require status checks" with these two job names: `backend / build-test-package` and `frontend / build-test`.

### Why no SonarCloud / server-side SonarQube

PRD Q4 still open. Adding it requires a SonarCloud account + a `SONAR_TOKEN` secret + the SonarScanner.MSBuild wrapper. Story 7.4 (IDE-only SonarLint) already satisfies the brief's literal text. Coach can add later.

### What `npm run build` ships

Vite reads `.env.production` (Story 3.3) to bake `VITE_API_BASE_URL`. Current value is the placeholder `https://api.example.com` — build still succeeds; the bundle just points nowhere useful. Override at build time via the `VITE_API_BASE_URL` env var if a real deployment happens.

### Why no NuGet cache

`actions/setup-dotnet@v4` can cache restored packages but the cache key needs `packages.lock.json` files. We haven't enabled lock files — adding them is an optional later optimisation. Current restore takes < 30 s on a fresh runner; not worth the extra YAML.

### Out of scope

- Branch protection rules (PRD §11 C7).
- PR-title format check (manual coach review).
- SonarCloud (PRD Q4).
- Coverage gates (informational only).
- Deployment to any host (Azure marked NA in brief).

### Project Structure Notes

- **NEW:** `.github/workflows/backend.yml`
- **NEW:** `.github/workflows/frontend.yml`

### References

- [Source: PRD §6 NFR9; §11 C6, C7](../planning-artifacts/prd.md)
- [Source: epics.md Story 8.1](../planning-artifacts/epics.md)
- GitHub Actions: https://docs.github.com/en/actions
- `actions/setup-dotnet`: https://github.com/actions/setup-dotnet
- `actions/setup-node`: https://github.com/actions/setup-node

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
