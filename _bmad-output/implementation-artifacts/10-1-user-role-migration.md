# Story 10.1: `Role` on `User` + migration + seed an admin account

Status: ready-for-dev

## Story

As **the team**,
I want **a `Role` column on `User` (`"User"` or `"Admin"`), a migration that adds it, and one seeded admin account**,
so that **later stories in Epic 10 have something to authorize against and an account to log in with**.

## Acceptance Criteria

1. `backend/WebCalculator.Api/Data/User.cs` gains `public string Role { get; set; } = "User";` with `[Required, MaxLength(20)]`.
2. A new EF Core migration (`AddUserRole`) adds the `Role` column (`NVARCHAR(20) NOT NULL DEFAULT 'User'`) and applies cleanly on top of `InitialCreate`.
3. `DataSeeder` seeds the two existing scripted users (`evi`, `nik`) with `Role = "User"` (unchanged behaviour) and adds one new scripted admin account, `admin` / (password documented in `docs/scripted-users.md`, **not** hardcoded anywhere else), with `Role = "Admin"`.
4. `sql/002_seed_users.sql` (or the next free number in `sql/`) is updated/mirrored to match the seeded admin row (hash generated via BCrypt, not plaintext).
5. `docs/scripted-users.md` documents the new admin account the same way the existing scripted users are documented.
6. Rollback (`dotnet ef database update <previous-migration>`) removes the `Role` column without touching `Users`/`Calculations` row data otherwise.

## Tasks / Subtasks

- [ ] **Task 1 — Add the property** (AC: 1)
  - [ ] Edit `User.cs` per Dev Notes.
- [ ] **Task 2 — Generate + apply the migration** (AC: 2, 6)
  - [ ] `dotnet ef migrations add AddUserRole --project backend/WebCalculator.Api`
  - [ ] `dotnet ef database update --project backend/WebCalculator.Api`
  - [ ] Verify: `EXEC sp_help 'Users'` shows `Role NVARCHAR(20) NOT NULL`.
- [ ] **Task 3 — Update the seeder** (AC: 3)
  - [ ] Extend `DataSeeder.ScriptedUsers` (or the equivalent structure) with role info, per Dev Notes.
- [ ] **Task 4 — Update the SQL mirror + docs** (AC: 4, 5)
  - [ ] Regenerate the seed SQL script to include the `Role` column and the admin row.
  - [ ] Add the admin account to `docs/scripted-users.md`.
- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/10.1-user-role-migration`

## Dev Notes

### `User.cs` — full file after change

`backend/WebCalculator.Api/Data/User.cs`:

```csharp
using System.ComponentModel.DataAnnotations;

namespace WebCalculator.Api.Data;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = "";

    [Required, MaxLength(256)]
    public string PasswordHash { get; set; } = "";

    [Required, MaxLength(20)]
    public string Role { get; set; } = "User";   // ← new

    public DateTime CreatedAt { get; set; }

    // Navigation
    public List<Calculation> Calculations { get; set; } = new();
}
```

Kept as a plain string (not an enum + value converter, not a separate `Roles` table) per PRD §11 C6. Two values, not a permissions system. Revisit only if a third role is ever needed.

### `DataSeeder.cs` — full updated file

`backend/WebCalculator.Api/Data/DataSeeder.cs`:

```csharp
using Microsoft.EntityFrameworkCore;

namespace WebCalculator.Api.Data;

public static class DataSeeder
{
    private static readonly (string Username, string Password, string Role)[] ScriptedUsers =
    {
        ("evi",   "1234", "User"),
        ("nik",   "5678", "User"),
        ("admin", "admin123", "Admin"),   // ← new; password also recorded in docs/scripted-users.md
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
                Username     = u.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password),
                Role         = u.Role,   // ← new
            });
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Count} users.", ScriptedUsers.Length);
        return ScriptedUsers.Length;
    }
}
```

> **Why `SeedAsync` guards with `AnyAsync`?** If you’re running against an existing dev DB that already has `evi`/`nik` rows (seeded by Story 4.4), the seeder skips entirely — including the new `admin` row. In that case you need to either wipe and re-seed the dev DB (`DELETE FROM Users; DELETE FROM __EFMigrationsHistory; dotnet ef database update`) or add the admin row by hand via `sqlcmd`. Choose the simplest option for your dev environment.

### Migration commands

```bash
# From the repo root:
dotnet ef migrations add AddUserRole --project backend/WebCalculator.Api
dotnet ef database update --project backend/WebCalculator.Api
```

Expected output from `database update`:

```
Build started...
Applying migration '20260803xxxxxx_AddUserRole'.
Done.
```

Verify with:

```bash
sqlcmd -S "(localdb)\MSSQLLocalDB" -d WebCalculator \
       -Q "SELECT Id, Username, Role, CreatedAt FROM Users"
```

Expected: 3 rows — `evi`/`User`, `nik`/`User`, `admin`/`Admin`.

### What the generated migration should contain

The generated `<timestamp>_AddUserRole.cs` should look roughly like this. Compare your generated output against this to catch surprises:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: "Role",
        table: "Users",
        type: "nvarchar(20)",
        maxLength: 20,
        nullable: false,
        defaultValue: "User");   // ← EF sets this; existing rows get "User"
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(
        name: "Role",
        table: "Users");
}
```

### SQL mirror for `docs/scripted-users.md`

The existing `docs/scripted-users.md` documents `evi` and `nik`. Add the admin account in the same format, for example:

```markdown
## Scripted accounts

| Username | Password  | Role  | Notes                         |
|----------|-----------|-------|-------------------------------|
| evi      | 1234      | User  | Original training account     |
| nik      | 5678      | User  | Original training account     |
| admin    | admin123  | Admin | Added Epic 10 — dev-only; do not use in production |
```

### SQL seed mirror (`sql/002_seed_users.sql` or next free number)

Before generating BCrypt hashes, be aware that the hash will change every time you generate it (BCrypt uses a random salt). The SQL file should contain actual pre-generated hashes, not a placeholder. Generate once and paste the output:

```bash
# Quick C# one-liner to generate the hash (run from any .NET project):
dotnet run --project backend/WebCalculator.Api -- --hash admin123
# Or use an online BCrypt tool (dev-only — never hash prod passwords online)
```

Then commit the resulting hash:

```sql
-- sql/002_seed_users.sql (mirrors DataSeeder.cs — dev-only)
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
    INSERT INTO dbo.Users (Username, PasswordHash, Role)
    VALUES ('admin', '$2a$11$...generated_hash...', 'Admin');

-- Ensure existing rows have the correct Role (safe to run on an already-seeded DB)
UPDATE dbo.Users SET Role = 'User' WHERE Username IN ('evi', 'nik') AND Role = '';
```

### Migration safety

`AddUserRole` must not be squashed into `InitialCreate` — Story 4.3 is already merged and may have been applied to a live dev DB. Always add as a new, additive migration.

### Out of scope

- JWT `role` claim + `[Authorize(Roles=...)]` enforcement — Story 10.2.
- Admin CRUD endpoints — Story 10.3.
- Role-aware history scoping — Story 10.4.
- Any frontend changes — Stories 10.5-10.7.

### Project Structure Notes

- **MODIFY:** `backend/WebCalculator.Api/Data/User.cs` (add `Role` property)
- **MODIFY:** `backend/WebCalculator.Api/Data/DataSeeder.cs` (add `admin` scripted account + `Role` on existing seeds)
- **NEW:** `backend/WebCalculator.Api/Migrations/<timestamp>_AddUserRole.cs` (generated)
- **MODIFY:** `sql/002_seed_users.sql` (or next free number) — add `Role` column + admin row
- **MODIFY:** `docs/scripted-users.md` (document the admin account)

### References

- [Source: PRD §8 Data Model (Users.Role); §11 C2 (superseded)](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.1](../planning-artifacts/epics.md)
- [Source: Story 4.3 — original `Users`/`Calculations` schema](./4-3-users-calculations-tables.md)
- [Source: Story 4.4 — seed pattern this story extends](./4-4-seed-users-bcrypt.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
