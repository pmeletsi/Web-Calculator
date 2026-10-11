# Web Calculator

PwC junior-developer training exercise — a web calculator with login, history, and full implementation discipline (multi-environment configuration, unit testing, and CI).

- **Frontend:** React 19 + Vite + Material UI
- **Backend:** ASP.NET Core 8 + EF Core _(in progress)_
- **Database:** SQL Server _(in progress)_

Authoritative documentation:  
[PRD](_bmad-output/planning-artifacts/prd.md) · [Epics + serial roadmap](_bmad-output/planning-artifacts/epics.md) · [Decisions](docs/decisions.md)

- [docs/scripted-users.md](docs/scripted-users.md) — dev credentials and how seeding works

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

FE reads `VITE_API_BASE_URL` from `.env.development` (used by `npm run dev`) or `.env.production` (used by `npm run build`). Personal overrides go in `.env.local` (gitignored).

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


## Screenshots from the web calculator
## USER

<img width="1280" height="710" alt="Screenshot_2026-08-26_121249" src="https://github.com/user-attachments/assets/b15ed73b-a51a-4417-a394-a6762d991b13" />
<img width="1536" height="677" alt="Screenshot_2026-08-26_121311" src="https://github.com/user-attachments/assets/a09bf06a-c77e-483b-9963-c02c04ec0dbe" />
<img width="1280" height="667" alt="Screenshot_2026-08-26_121528" src="https://github.com/user-attachments/assets/67790dc0-2605-4bb7-8e51-f46b76d254b6" />
<img width="1280" height="578" alt="Screenshot_2026-08-26_121516" src="https://github.com/user-attachments/assets/2f7023b8-9b48-4bb4-8235-d3dbe8dec0da" />
<img width="1536" height="681" alt="Screenshot_2026-08-26_121445" src="https://github.com/user-attachments/assets/d27839ba-0dca-47f9-b729-0b65965c5b3b" />

## ADMIN

<img width="1280" height="586" alt="Screenshot_2026-08-22_094154" src="https://github.com/user-attachments/assets/e4116031-ba4d-4e65-8694-1a003f92f96d" />
<img width="1536" height="582" alt="Screenshot_2026-08-22_131311" src="https://github.com/user-attachments/assets/5d63601f-13d7-4177-88dc-cb7f59073543" />
<img width="1536" height="659" alt="Screenshot_2026-08-22_153054" src="https://github.com/user-attachments/assets/eb01e284-a6b2-4bf5-9f96-bc8800f3bf42" />
<img width="1536" height="681" alt="Screenshot_2026-08-26_121445" src="https://github.com/user-attachments/assets/9e0b2f92-dcf5-48a5-9aa2-531efe617fc4" />
<img width="1536" height="684" alt="Screenshot_2026-08-26_121557" src="https://github.com/user-attachments/assets/c87d9caa-a6c7-48a0-af6d-89aadc1c617f" />

## SonarQube
<img width="1284" height="548" alt="Screenshot_2026-07-28_143228" src="https://github.com/user-attachments/assets/7255e9c2-9d40-4df6-9e62-12095f3de479" />
<img width="1373" height="551" alt="Screenshot_2026-07-28_144140" src="https://github.com/user-attachments/assets/aec5ef34-1292-4cd8-abdd-9554bd435584" />









