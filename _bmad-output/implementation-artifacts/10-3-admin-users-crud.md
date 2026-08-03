# Story 10.3: Admin users CRUD — `GET/POST/DELETE /api/admin/users`

Status: ready-for-dev

## Story

As **an Admin**,
I want **to list all accounts, create new accounts, and delete existing accounts**,
so that **the training brief's account-management requirement is met without a database console**.

## Acceptance Criteria

1. `GET /api/admin/users` returns `200` with an array of `{ id, username, role, createdAt }` for every user, **never** `passwordHash`. `[Authorize(Roles = "Admin")]`.
2. `POST /api/admin/users` accepts `{ username, password, role }`:
   - `201 Created` with the new user's `{ id, username, role, createdAt }` on success.
   - `400 Bad Request` if `username` is empty/whitespace, `password` is shorter than 4 characters, or `role` is not `"User"`/`"Admin"`.
   - `409 Conflict` if `username` already exists (case-insensitive).
   - Password is hashed with BCrypt before persisting — never stored or logged in plaintext.
3. `DELETE /api/admin/users/{id}`:
   - `204 No Content` on success.
   - `404 Not Found` if no such user.
   - `409 Conflict` if deleting would violate the `Calculations.UserId` FK (`OnDelete(Restrict)` from Story 4.3) — i.e. the user has calculation history. Response body: `{ error: "Cannot delete a user with existing calculation history." }`.
   - `400 Bad Request` (`{ error: "You cannot delete your own account." }`) if the caller's own `id` (from the JWT `sub` claim) matches the target `id`.
4. All three actions require an `Admin`-role JWT; a `User`-role JWT gets `403` on all three (inherited from `[Authorize(Roles = "Admin")]` at the controller level, per Story 10.2).
5. A new `AdminUserService` (or equivalent) in `Services/` holds this logic — controller stays thin (PRD §11 C6: Controller → Service → DbContext, no Repository layer).

## Tasks / Subtasks

- [ ] **Task 1 — `Models/AdminUserRequest.cs`** (AC: 2)
  - [ ] `{ string Username, string Password, string Role }` with data annotations mirroring the validation in AC 2.
- [ ] **Task 2 — `Services/AdminUserService.cs`** (AC: 1, 2, 3, 5)
  - [ ] `ListAsync()`, `CreateAsync(request)`, `DeleteAsync(id, callerId)` per Dev Notes.
- [ ] **Task 3 — Extend `AdminController`** (AC: 1, 2, 3, 4)
  - [ ] Add `GET`, `POST`, `DELETE {id:int}` actions under `api/admin/users`, delegating to the service.
- [ ] **Task 4 — Manual verification** (AC: all)
  - [ ] As `admin`: `GET /api/admin/users` → array includes `evi`, `nik`, `admin`, no `passwordHash` field.
  - [ ] `POST` a new user `{ "username": "temp", "password": "temp123", "role": "User" }` → `201`; row visible in `Users` table with a BCrypt hash.
  - [ ] `POST` again with the same username → `409`.
  - [ ] `DELETE` the `temp` user (no calculations yet) → `204`; row gone.
  - [ ] `DELETE` a user who has calculation history (e.g. `evi`, if she's used the calculator) → `409` with the documented error body.
  - [ ] `DELETE` your own `admin` id → `400`.
  - [ ] Repeat `GET`/`POST`/`DELETE` with a `User`-role token → all `403`.
- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/10.3-admin-users-crud`

## Dev Notes

### `Models/AdminUserRequest.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace WebCalculator.Api.Models;

public record AdminUserRequest(
    [Required, MaxLength(50)] string Username,
    [Required, MinLength(4), MaxLength(128)] string Password,
    [Required] string Role
);

public record AdminUserResponse(int Id, string Username, string Role, DateTime CreatedAt);
```

Both records in one file. `AdminUserResponse` is the DTO — it **never** includes `PasswordHash`.

### `AdminDeleteResult` enum

Define inline inside `AdminUserService.cs` (same file is fine given its small size):

```csharp
public enum AdminDeleteResult
{
    Deleted,
    NotFound,
    HasHistory,
    CannotDeleteSelf
}
```

### `Services/AdminUserService.cs` — full file

```csharp
using Microsoft.EntityFrameworkCore;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;

namespace WebCalculator.Api.Services;

public enum AdminDeleteResult { Deleted, NotFound, HasHistory, CannotDeleteSelf }

public class AdminUserService
{
    private readonly AppDbContext _db;

    public AdminUserService(AppDbContext db) => _db = db;

    // GET — list all users, never leaking PasswordHash
    public async Task<List<AdminUserResponse>> ListAsync(CancellationToken ct) =>
        await _db.Users
            .OrderBy(u => u.Username)
            .Select(u => new AdminUserResponse(u.Id, u.Username, u.Role, u.CreatedAt))
            .ToListAsync(ct);

    // POST — create a new account
    public async Task<(bool Conflict, AdminUserResponse? Created)> CreateAsync(
        AdminUserRequest request, CancellationToken ct)
    {
        // Case-insensitive duplicate check (SQL Server default collation is case-insensitive,
        // but the InMemory provider used in tests is case-sensitive — normalise in code to be safe)
        var exists = await _db.Users
            .AnyAsync(u => u.Username.ToLower() == request.Username.ToLower(), ct);

        if (exists) return (true, null);

        var user = new User
        {
            Username     = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role         = request.Role,
            // CreatedAt defaults via SYSUTCDATETIME() in SQL Server;
            // set it explicitly here so the response has a real value, not DateTime.MinValue
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return (false, new AdminUserResponse(user.Id, user.Username, user.Role, user.CreatedAt));
    }

    // DELETE — remove an account; blocks if user has calculation history (FK Restrict)
    public async Task<AdminDeleteResult> DeleteAsync(int id, int callerId, CancellationToken ct)
    {
        if (id == callerId) return AdminDeleteResult.CannotDeleteSelf;

        var user = await _db.Users.FindAsync(new object[] { id }, ct);
        if (user is null) return AdminDeleteResult.NotFound;

        _db.Users.Remove(user);
        try
        {
            await _db.SaveChangesAsync(ct);
            return AdminDeleteResult.Deleted;
        }
        catch (DbUpdateException)
        {
            // FK constraint violation — user has rows in Calculations (OnDelete: Restrict, Story 4.3)
            // Detach the entity so the DbContext is clean for the next request
            _db.Entry(user).State = EntityState.Unchanged;
            return AdminDeleteResult.HasHistory;
        }
    }
}
```

> **Why set `CreatedAt = DateTime.UtcNow` in the service?** SQL Server applies `SYSUTCDATETIME()` as the column default at INSERT time, but `db.SaveChanges` doesn't re-read the row by default, so `user.CreatedAt` would still be `DateTime.MinValue` immediately after insert. Setting it in code gives the response a real timestamp without an extra round-trip `SELECT`. Acceptable small inconsistency between the service value and the DB-written value (sub-second difference).

### `AdminController.cs` — users endpoints (replaces/extends the stub from 10.2)

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AdminUserService _userService;

    public AdminController(AdminUserService userService) => _userService = userService;

    [HttpGet("ping")]   // keep from 10.2 as a health check
    public IActionResult Ping() => Ok(new { ok = true });

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> ListUsers(CancellationToken ct)
    {
        var users = await _userService.ListAsync(ct);
        return Ok(users);
    }

    // POST /api/admin/users
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(
        [FromBody] AdminUserRequest request, CancellationToken ct)
    {
        // Role value guard — model validation catches empty/null; this catches invalid values
        if (request.Role is not ("User" or "Admin"))
            return BadRequest(new { error = "Role must be \"User\" or \"Admin\"." });

        var (conflict, created) = await _userService.CreateAsync(request, ct);
        if (conflict) return Conflict(new { error = $"Username '{request.Username}' is already taken." });

        return CreatedAtAction(nameof(ListUsers), created);
    }

    // DELETE /api/admin/users/{id}
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
    {
        // Read the caller's own id from the JWT "uid" claim (set in Story 5.2)
        var callerIdStr = User.FindFirst("uid")?.Value;
        if (!int.TryParse(callerIdStr, out var callerId)) return Unauthorized();

        var result = await _userService.DeleteAsync(id, callerId, ct);

        return result switch
        {
            AdminDeleteResult.Deleted          => NoContent(),
            AdminDeleteResult.NotFound         => NotFound(),
            AdminDeleteResult.HasHistory       => Conflict(new { error = "Cannot delete a user with existing calculation history." }),
            AdminDeleteResult.CannotDeleteSelf => BadRequest(new { error = "You cannot delete your own account." }),
            _                                  => StatusCode(500),
        };
    }
}
```

### Register `AdminUserService` in `Program.cs`

```csharp
// Add alongside the existing service registrations:
builder.Services.AddScoped<AdminUserService>();
```

Story 4.3 deliberately set `OnDelete(DeleteBehavior.Restrict)` on `Calculation.UserId` so history survives even if the owning account is later removed (PRD §11 C3 rationale: audit trail). Epic 10 doesn't reopen that decision — it just needs to surface the resulting `DbUpdateException` as a clean `409` instead of a `500`.

```csharp
### Out of scope

- Promoting/demoting an existing user's role (PATCH) — not requested; see PRD Q5 open question.
- Frontend `AdminUsers.jsx` — Story 10.6.
- Automated tests — Story 10.8.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Models/AdminUserRequest.cs`
- **NEW:** `backend/WebCalculator.Api/Services/AdminUserService.cs`
- **MODIFY:** `backend/WebCalculator.Api/Controllers/AdminController.cs` (add users endpoints)
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (`AddScoped<AdminUserService>()`)

### References

- [Source: PRD §5 FR7; §9 API Surface (`/api/admin/users`); §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.3](../planning-artifacts/epics.md)
- [Source: Story 10.2 — `AdminController` guard this extends](./10-2-jwt-role-authorization.md)
- [Source: Story 4.3 — `OnDelete(Restrict)` FK this respects](./4-3-users-calculations-tables.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
