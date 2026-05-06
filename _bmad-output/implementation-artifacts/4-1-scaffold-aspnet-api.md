# Story 4.1: Scaffold ASP.NET Core Web API solution

Status: ready-for-dev

## Story

As **the team**,
I want **a single ASP.NET Core Web API project plus a test project under `backend/`, organised by simple folders (`Controllers/` · `Services/` · `Data/` · `Models/`)**,
so that **all subsequent backend stories have a stable, intern-friendly skeleton — without Clean Architecture / DDD / CQRS / Repository pattern overhead** (PRD §11 C6).

## Acceptance Criteria

1. The repo's `.gitignore` no longer blocks `.sln` files; .NET-specific ignores are added (`bin/`, `obj/`, `*.user`, `appsettings.*.local.json`).
2. A solution lives at `backend/WebCalculator.sln` containing **exactly two projects**:
   - `backend/WebCalculator.Api/` — ASP.NET Core Web API (.NET 8, controllers)
   - `backend/WebCalculator.Tests/` — xUnit test project
3. The `WebCalculator.Tests` project references `WebCalculator.Api` so tests can call services and controllers directly.
4. `Program.cs` exposes a `GET /healthz` endpoint that returns `200 OK` with `{ "status": "healthy" }`.
5. `appsettings.json`, `appsettings.Development.json`, and `appsettings.Production.json` exist with placeholder structure (no real secrets).
6. The dev server is pinned to `http://localhost:5000` (HTTP) — matches `VITE_API_BASE_URL` from Story 3.3.
7. `dotnet build backend/WebCalculator.sln` succeeds.
8. `dotnet run --project backend/WebCalculator.Api` starts; `curl http://localhost:5000/healthz` returns `200`.

## Tasks / Subtasks

- [ ] **Task 1 — Update `.gitignore` for .NET** (AC: 1)
  - [ ] **Remove** the line `*.sln` (it would block our solution file).
  - [ ] **Add** at the bottom:
    ```
    # Backend (.NET)
    backend/**/bin/
    backend/**/obj/
    backend/**/*.user
    backend/**/appsettings.*.local.json
    backend/.vs/
    ```

- [ ] **Task 2 — Create solution + two projects** (AC: 2)
  - [ ] In repo root:
    ```bash
    mkdir backend
    dotnet new sln -n WebCalculator -o backend
    dotnet new webapi -n WebCalculator.Api   -o backend/WebCalculator.Api   --use-controllers --framework net8.0
    dotnet new xunit  -n WebCalculator.Tests -o backend/WebCalculator.Tests --framework net8.0
    ```
  - [ ] Add to solution (single line — works in bash, PowerShell, and cmd):
    ```bash
    dotnet sln backend/WebCalculator.sln add backend/WebCalculator.Api/WebCalculator.Api.csproj backend/WebCalculator.Tests/WebCalculator.Tests.csproj
    ```

- [ ] **Task 3 — Wire test project reference** (AC: 3)
  - [ ] ```bash
    dotnet add backend/WebCalculator.Tests/WebCalculator.Tests.csproj reference backend/WebCalculator.Api/WebCalculator.Api.csproj
    ```

- [ ] **Task 4 — Replace the WeatherForecast template + add `/healthz`** (AC: 4)
  - [ ] Delete `backend/WebCalculator.Api/Controllers/WeatherForecastController.cs`.
  - [ ] Delete `backend/WebCalculator.Api/WeatherForecast.cs`.
  - [ ] Replace `backend/WebCalculator.Api/Program.cs` with the content in **Dev Notes → `Program.cs` skeleton**.

- [ ] **Task 5 — Configure dev port** (AC: 6)
  - [ ] Edit `backend/WebCalculator.Api/Properties/launchSettings.json` per **Dev Notes → `launchSettings.json`**.

- [ ] **Task 6 — Set up appsettings placeholders** (AC: 5)
  - [ ] Replace the three `appsettings*.json` files per **Dev Notes → appsettings stubs**.

- [ ] **Task 7 — Verify** (AC: 7, 8)
  - [ ] `dotnet build backend/WebCalculator.sln` → 0 warnings.
  - [ ] `dotnet run --project backend/WebCalculator.Api` → console shows `Now listening on: http://localhost:5000`.
  - [ ] In another shell: `curl http://localhost:5000/healthz` → `200 {"status":"healthy"}`.

- [ ] **Task 8 — Open the PR**
  - [ ] Branch: `feature/4.1-scaffold-aspnet-api`

## Dev Notes

### Why a `backend/` directory and only two projects

A single repo for FE + BE; `backend/` keeps .NET artefacts physically separated from `src/`.
**Two projects, not four.** PRD §11 C6 sets an explicit complexity ceiling: plain layered architecture (Controller → Service → DbContext via EF Core) inside one project. No Clean Architecture, no DDD, no Repository pattern, no CQRS, no separate `Domain` / `Infrastructure` projects.

### Folder structure inside `WebCalculator.Api/`

We don't pre-create empty folders (Git doesn't track them). They appear naturally as files are added in later stories:

```
backend/WebCalculator.Api/
├── Controllers/   ← thin HTTP layer (added in Stories 5.2, 5.4, 5.5)
├── Services/      ← business logic (added in Stories 5.1, 5.2, 5.4)
├── Data/          ← EF Core: AppDbContext + entities + DataSeeder (Stories 4.2, 4.3, 4.4)
├── Models/        ← DTOs / request-response shapes (added in Epic 5)
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── appsettings.Production.json
└── WebCalculator.Api.csproj
```

### `Program.cs` skeleton

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// TODO(4.2): builder.Services.AddDbContext<AppDbContext>(...);
// TODO(5.3): CORS for the Vite dev server origin.

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));
app.MapControllers();

app.Run();
```

### `appsettings` stubs

`appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

`appsettings.Development.json` (gains a `ConnectionStrings` block in Story 4.2):
```json
{
  "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Information" } }
}
```

`appsettings.Production.json` (placeholders only — real secrets via env vars / User Secrets):
```json
{
  "Logging": { "LogLevel": { "Default": "Warning", "Microsoft.AspNetCore": "Warning" } }
}
```

### `launchSettings.json`

```json
{
  "$schema": "http://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" }
    }
  }
}
```

### Why pin to port 5000

Story 3.3 set `VITE_API_BASE_URL=http://localhost:5000`. Pinning here means **no env-var change** when Stories 6.x start calling the API.

### What's NOT in this story

- `AppDbContext` / EF Core packages (Story 4.2)
- Entities (Story 4.3)
- Seeded users (Story 4.4)
- Validators / services (Epic 5)
- CORS (Story 5.3)
- JWT middleware (Story 5.3)

### Project Structure Notes

- **NEW:** `backend/WebCalculator.sln`
- **NEW:** `backend/WebCalculator.Api/` (with `Program.cs`, `appsettings*.json`, `Controllers/` from template — to be cleaned)
- **NEW:** `backend/WebCalculator.Tests/`
- **DELETE:** auto-generated `WeatherForecast.cs` and its controller
- **MODIFY:** `.gitignore` (remove `*.sln`, add .NET ignores)

### References

- [Source: PRD §6 NFR1, NFR7; §7 Tech Stack; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 4.1](../planning-artifacts/epics.md)
- [Source: docs/decisions.md D6 — plain layered architecture](../../docs/decisions.md)
- ASP.NET Core minimal hosting: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
