# Story 4.4: Seed scripted users with BCrypt-hashed passwords

Status: ready-for-dev

## Story

As **the team**,
I want **two scripted users (`evi`, `nik`) seeded into the `Users` table with BCrypt-hashed passwords on first run**,
so that **Story 5.2 can authenticate them and Story 6.2 can complete the login flow against real credentials — without ever committing a plaintext password (PRD §12 risk register)**.

## Acceptance Criteria

1. The package `BCrypt.Net-Next` is installed in `WebCalculator.Api`.
2. A static class `DataSeeder` in `backend/WebCalculator.Api/Data/DataSeeder.cs` exposes `SeedAsync(AppDbContext, ILogger, CancellationToken)`. When called against an empty `Users` table, it inserts:
   - `Username = "evi"`, `PasswordHash = BCrypt.HashPassword("1234")`
   - `Username = "nik"`, `PasswordHash = BCrypt.HashPassword("5678")`
3. The seeder is **idempotent** — running it twice does not duplicate users.
4. `Program.cs` calls `MigrateAsync` then `SeedAsync` on startup inside a scoped service provider.
5. After dropping the dev DB and starting the app, `SELECT Username FROM Users` returns exactly the two seeded usernames; `PasswordHash` values are valid BCrypt hashes (each starts with `$2a$` or `$2b$`, length 60).
6. **No plaintext password is committed** outside `DataSeeder.cs` (a dev/seed file).
7. `docs/scripted-users.md` exists, lists the credentials with a clear "**dev only**" warning, and is linked from the README.

## Tasks / Subtasks

- [ ] **Task 1 — Add the BCrypt package** (AC: 1)
  - [ ] `dotnet add backend/WebCalculator.Api package BCrypt.Net-Next`

- [ ] **Task 2 — Create the seeder** (AC: 2, 3)
  - [ ] `backend/WebCalculator.Api/Data/DataSeeder.cs` per **Dev Notes → `DataSeeder` content**.

- [ ] **Task 3 — Wire the seeder from `Program.cs`** (AC: 4)
  - [ ] Just before `app.Run()`, insert the block in **Dev Notes → `Program.cs` startup hook**.

- [ ] **Task 4 — Verify a fresh seed** (AC: 5)
  - [ ] `dotnet ef database update 0 --project backend/WebCalculator.Api`
  - [ ] `dotnet run --project backend/WebCalculator.Api` — log shows `Seeded 2 users.`
  - [ ] `sqlcmd -S "(localdb)\MSSQLLocalDB" -d WebCalculator -Q "SELECT Username, LEN(PasswordHash) AS HashLen FROM Users"` → 2 rows, `HashLen = 60`, hashes start with `$2`.

- [ ] **Task 5 — Verify idempotence** (AC: 3)
  - [ ] Restart the app — log shows `Seed skipped: Users table already populated.` Row count stays at 2.

- [ ] **Task 6 — Document the credentials** (AC: 6, 7)
  - [ ] Create `docs/scripted-users.md` per **Dev Notes → Scripted-users page**.
  - [ ] In `README.md`, under the existing docs links, add: `- [docs/scripted-users.md](docs/scripted-users.md) — dev credentials and how seeding works`.

- [ ] **Task 7 — Open the PR**
  - [ ] Branch: `feature/4.4-seed-users-bcrypt`

## Dev Notes

### `DataSeeder` content

`backend/WebCalculator.Api/Data/DataSeeder.cs`:

```csharp
using Microsoft.EntityFrameworkCore;

namespace WebCalculator.Api.Data;

public static class DataSeeder
{
    private static readonly (string Username, string Password)[] ScriptedUsers =
    {
        ("evi", "1234"),
        ("nik", "5678"),
    };

    public static async Task<int> SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            logger.LogInformation("Seed skipped: Users table already populated.");
            return 0;
        }

        foreach (var u in ScriptedUsers)
        {
            db.Users.Add(new User
            {
                Username = u.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password),
                // CreatedAt is set by SYSUTCDATETIME() default at insert time.
            });
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Count} users.", ScriptedUsers.Length);
        return ScriptedUsers.Length;
    }
}
```

### `Program.cs` startup hook

Just before `app.Run()`, add:

```csharp
using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<AppDbContext>();
    var logger = sp.GetRequiredService<ILogger<Program>>();

    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(db, logger);
}
```

(`using Microsoft.EntityFrameworkCore;` and `using WebCalculator.Api.Data;` are already imported in Story 4.2.)

### Scripted-users page

`docs/scripted-users.md`:

```markdown
# Scripted Users

> ⚠️ **Dev environment only.** These credentials must NEVER be used outside local development.

The application seeds two users on first start (Story 4.4). They satisfy the brief's "users can be scripted" requirement (no in-app user management).

| Username | Password | Notes                  |
|----------|----------|------------------------|
| `evi`    | `1234`   | Mirrors the original FE hardcoded user (`src/Login.jsx`). |
| `nik`    | `5678`   | Same.                  |

## How seeding works

- `DataSeeder.SeedAsync` runs on every app startup but is idempotent — it inserts users only if `Users` is empty.
- Passwords are hashed with **BCrypt** (`BCrypt.Net-Next`).
- To reset and re-seed:
  ```
  dotnet ef database update 0 --project backend/WebCalculator.Api
  dotnet run --project backend/WebCalculator.Api
  ```

## For real production

Either remove `DataSeeder.SeedAsync` from the startup hook, or replace `ScriptedUsers` with credentials sourced from environment variables / a secret store. Out of scope for this exercise.
```

### Why runtime seeder, not `HasData`

A runtime BCrypt hash is **not committed**. `HasData` would require a precomputed hash baked into a migration source file. Both work; we pick the runtime path for cleaner `git log` and to keep things boring (PRD §11 C6).

### Out of scope

- The login endpoint (Story 5.2).
- Frontend wiring (Story 6.2).
- Removing the original hardcoded `users` array from `src/pages/Login.jsx` (Story 6.2).
- Password rotation, lockout, MFA — not in PRD §5.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Data/DataSeeder.cs`
- **NEW:** `docs/scripted-users.md`
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (add startup migrate + seed hook)
- **MODIFY:** `backend/WebCalculator.Api/WebCalculator.Api.csproj` (BCrypt.Net-Next package ref)
- **MODIFY:** `README.md` (link to scripted-users page)

### References

- [Source: PRD §5 FR1, §11 C6, §12 Risk register](../planning-artifacts/prd.md)
- [Source: epics.md Story 4.4 + downstream Story 5.2, 6.2](../planning-artifacts/epics.md)
- BCrypt.Net-Next: https://github.com/BcryptNet/bcrypt.net

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
