# Story 4.2: EF Core + SQL Server with multi-env connection strings

Status: ready-for-dev

## Story

As **the team**,
I want **EF Core wired to SQL Server with `AppDbContext` registered directly in `Program.cs`, and connection strings that vary by environment**,
so that **Story 4.3 can add entities and Stories 5.x can inject `AppDbContext` directly** — keeping the architecture flat with no extension methods or DI helpers (PRD §11 C6).

## Acceptance Criteria

1. EF Core packages installed in `WebCalculator.Api`:
   - `Microsoft.EntityFrameworkCore.SqlServer` (8.x)
   - `Microsoft.EntityFrameworkCore.Design` (8.x — for `dotnet ef` tooling)
2. `backend/WebCalculator.Api/Data/AppDbContext.cs` exists, derives from `DbContext`, and accepts `DbContextOptions<AppDbContext>` via constructor. **No `DbSet<>` properties yet** — entities arrive in Story 4.3.
3. `Program.cs` registers `AppDbContext` directly (no extension method, no `DependencyInjection.cs` file):
   ```csharp
   builder.Services.AddDbContext<AppDbContext>(opts =>
       opts.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
   ```
4. `appsettings.Development.json` contains a **LocalDB** connection string for `Default`.
5. `appsettings.Production.json` contains a **placeholder** with the `REPLACE_VIA_ENVVAR_OR_USER_SECRETS` sentinel.
6. `docs/decisions.md` (Story 1.2) gains **D7** explaining that real secrets live in User Secrets / env vars, never in committed JSON.
7. `dotnet build backend/WebCalculator.sln` succeeds.
8. `dotnet ef dbcontext info --project backend/WebCalculator.Api` succeeds and lists `AppDbContext`.

## Tasks / Subtasks

- [ ] **Task 1 — Install the global EF Core CLI tool (one-time per machine)**
  - [ ] `dotnet tool install --global dotnet-ef --version 8.*`
  - [ ] Verify: `dotnet ef --version` → 8.x.

- [ ] **Task 2 — Add EF Core packages to the Api project** (AC: 1)
  - [ ] ```bash
    dotnet add backend/WebCalculator.Api package Microsoft.EntityFrameworkCore.SqlServer --version 8.*
    dotnet add backend/WebCalculator.Api package Microsoft.EntityFrameworkCore.Design   --version 8.*
    ```

- [ ] **Task 3 — Create `AppDbContext`** (AC: 2)
  - [ ] Create `backend/WebCalculator.Api/Data/AppDbContext.cs` per **Dev Notes → `AppDbContext` content**.

- [ ] **Task 4 — Register the DbContext in `Program.cs`** (AC: 3)
  - [ ] Replace the `// TODO(4.2): ...` line from Story 4.1 with:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(opts =>
        opts.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
    ```
  - [ ] Add `using Microsoft.EntityFrameworkCore;` and `using WebCalculator.Api.Data;` at the top.

- [ ] **Task 5 — Configure connection strings per env** (AC: 4, 5)
  - [ ] In `backend/WebCalculator.Api/appsettings.Development.json`, add:
    ```json
    {
      "ConnectionStrings": {
        "Default": "Server=(localdb)\\MSSQLLocalDB;Database=WebCalculator;Trusted_Connection=True;TrustServerCertificate=True;"
      }
    }
    ```
  - [ ] In `backend/WebCalculator.Api/appsettings.Production.json`, add:
    ```json
    {
      "ConnectionStrings": {
        "Default": "REPLACE_VIA_ENVVAR_OR_USER_SECRETS"
      }
    }
    ```

- [ ] **Task 6 — Set up User Secrets for sensitive overrides** (AC: 6)
  - [ ] ```bash
    dotnet user-secrets init --project backend/WebCalculator.Api
    # Example for Docker SQL Server (skip if using LocalDB):
    dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost,1433;Database=WebCalculator;User Id=sa;Password=Y0urStrong!Passw0rd;TrustServerCertificate=True;" --project backend/WebCalculator.Api
    ```

- [ ] **Task 7 — Document the secrets decision** (AC: 6)
  - [ ] Edit `docs/decisions.md` (created in Story 1.2). Append D7 per **Dev Notes → Decision D7 text**.

- [ ] **Task 8 — Verify** (AC: 7, 8)
  - [ ] `dotnet build backend/WebCalculator.sln` → succeeds.
  - [ ] `dotnet ef dbcontext info --project backend/WebCalculator.Api` → output includes `AppDbContext` and the SQL Server provider.
  - [ ] `dotnet run --project backend/WebCalculator.Api` → still starts; `/healthz` still returns 200.

- [ ] **Task 9 — Open the PR**
  - [ ] Branch: `feature/4.2-efcore-sqlserver-connection`

## Dev Notes

### `AppDbContext` content

`backend/WebCalculator.Api/Data/AppDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;

namespace WebCalculator.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSet<> properties + OnModelCreating land in Story 4.3.
}
```

That's the whole file. **No extension method, no separate Configurations folder, no DI helpers** — keeping it boring per PRD §11 C6.

### Decision D7 text

Append to `docs/decisions.md`:

```markdown
## D7 — Real secrets via User Secrets / env vars, never committed JSON
**Date:** 2026-05-06 · **Owner:** Coach

**Context.** PRD NFR6 requires multi-env config without code changes; the brief also requires we never leak credentials in source.

**Decision.** Committed `appsettings.{Env}.json` files contain only safe defaults (LocalDB Windows auth) or placeholders (`REPLACE_VIA_ENVVAR_OR_USER_SECRETS`). Real secrets live in:
- **Dev:** `dotnet user-secrets` (per-developer, not committed)
- **Production:** environment variables (e.g. `ConnectionStrings__Default=...`)

**Consequences.**
- (+) No accidental secret leak in `git log`.
- (+) `dotnet user-secrets list` is the canonical place to find what each dev is overriding.
- (−) An extra setup step for new contributors (covered in the README "Getting started" section, Story 1.2).
```

### Configuration override precedence

ASP.NET Core merges configuration in this order (later wins):

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. **User Secrets** (Development only)
4. Environment variables (e.g. `ConnectionStrings__Default`)
5. Command-line arguments

So a User-Secrets value silently overrides the committed Development JSON — exactly what we want.

### Why no migration in this story

The original epic AC said `dotnet ef migrations add InitialCreate`. We've moved that to Story 4.3 because:

- Without entities, `InitialCreate` would be empty.
- Naming the **first non-empty** migration `InitialCreate` is the convention.
- This story still verifies the toolchain via `dotnet ef dbcontext info`.

### Out of scope

- Entity classes and `DbSet<>` (Story 4.3).
- Seeded users (Story 4.4).
- Repository / Unit-of-Work pattern — **not introduced**. `AppDbContext` is the repository (PRD §11 C6).
- DI extension methods — **not introduced**. Direct registration in `Program.cs` is enough.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Data/AppDbContext.cs`
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (resolve TODO(4.2))
- **MODIFY:** `backend/WebCalculator.Api/appsettings.Development.json` (add ConnectionStrings)
- **MODIFY:** `backend/WebCalculator.Api/appsettings.Production.json` (add ConnectionStrings placeholder)
- **MODIFY:** `backend/WebCalculator.Api/WebCalculator.Api.csproj` (2 new package refs)
- **MODIFY:** `docs/decisions.md` (add D7)

### References

- [Source: PRD §6 NFR6, NFR8; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 4.2](../planning-artifacts/epics.md)
- EF Core install: https://learn.microsoft.com/en-us/ef/core/get-started/overview/install
- EF Core CLI: https://learn.microsoft.com/en-us/ef/core/cli/dotnet
- ASP.NET Core configuration: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/
- User Secrets: https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
