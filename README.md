# Web Calculator

PwC junior-developer training exercise — a web calculator with login, history, and full implementation discipline (multi-environment configuration, unit testing, and CI).

- **Frontend:** React 19 + Vite + Material UI
- **Backend:** ASP.NET Core 8 + EF Core _(in progress)_
- **Database:** SQL Server _(in progress)_

Authoritative documentation:  
[PRD](_bmad-output/planning-artifacts/prd.md) · [Epics + serial roadmap](_bmad-output/planning-artifacts/epics.md) · [Decisions](docs/decisions.md)

---

## Getting Started

### Prerequisites

- **.NET 8 SDK**  
  Windows: `winget install Microsoft.DotNet.SDK.8`  
  macOS: `brew install --cask dotnet-sdk`

- **Node 20+**  
  Windows: `winget install OpenJS.NodeJS.LTS`  
  macOS: `brew install node@20`

- **SQL Server**  
  Windows LocalDB (bundled with Visual Studio) or Docker:

  ```bash
  docker run -e "ACCEPT_EULA=Y" \
             -e "MSSQL_SA_PASSWORD=Y0urStrong!Passw0rd" \
             -p 1433:1433 \
             -d --name webcalc-mssql \
             mcr.microsoft.com/mssql/server:2022-latest
  ```

- **SonarLint** IDE plugin (Visual Studio / Rider / VS Code)

---

### Verify Installation

- [ ] `dotnet --version` → 8.x.x
- [ ] `node -v` → ≥ 20.0.0
- [ ] `npm -v` → ≥ 10
- [ ] LocalDB check:
  ```bash
  sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "SELECT 1"
  ```
  → returns `1`
- [ ] SonarLint shows issues in the IDE Problems panel

---

## Run

### Frontend

```bash
npm install
npm run dev
```

http://localhost:5173

---

### Backend _(after Story 4.1)_

```bash
dotnet run --project backend/WebCalculator.Api
```

http://localhost:5000

---

## Branching

Solo workflow:

- Use branches from `main`:

  ```
  feature/<story-id>-<slug>
  ```

  Example:

  ```
  feature/3.1-install-mui
  ```

- Rules:
  - One PR per story
  - Coach review before merge
  - Merge to `main` only

No `develop`, `release`, or `hotfix` branches (see PRD §11 C7).

---

## Tracking

Stories:  
`_bmad-output/implementation-artifacts/`

Status file:  
`sprint-status.yaml`

### Status values

- `ready-for-dev` → ready to start
- `in-progress` → active development
- `done` → merged to `main`

Pick the next task from:  
`_bmad-output/planning-artifacts/epics.md`
