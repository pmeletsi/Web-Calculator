# Story 10.2: JWT `role` claim + `[Authorize(Roles="Admin")]` guard

Status: ready-for-dev

## Story

As **the team**,
I want **the login JWT to carry the user's role, and an empty `AdminController` gated by `[Authorize(Roles = "Admin")]`**,
so that **every admin-only endpoint added in later stories inherits a working, tested authorization boundary from day one**.

## Acceptance Criteria

1. `AuthService.LoginAsync` adds a `ClaimTypes.Role` (or `"role"`) claim to the JWT, set to the authenticated user's `Role` ("User" or "Admin").
2. JWT bearer configuration in `Program.cs` maps that claim so `[Authorize(Roles = "Admin")]` works with `User.IsInRole("Admin")`.
3. A new empty `AdminController` exists at `api/admin` decorated with `[Authorize(Roles = "Admin")]` and one throwaway `GET api/admin/ping` action returning `200 OK` — used only to prove the guard works; removed or left as a health check in Story 10.3.
4. A request to `api/admin/ping` with a **User**-role token → `403 Forbidden`.
5. A request with an **Admin**-role token → `200 OK`.
6. A request with **no token** → `401 Unauthorized` (existing `[Authorize]` behaviour, unaffected).
7. `POST /api/auth/login` response body is unchanged in shape (still `{ token, username }`) — the role travels inside the JWT, not as a separate response field, so Story 6.1's `AuthContext` needs no wire-format change, only JWT decoding.

## Tasks / Subtasks

- [ ] **Task 1 — Add the role claim** (AC: 1)
  - [ ] Edit `AuthService.cs` where claims are built for `GenerateJwt`/equivalent; add the role claim from the loaded `User.Role`.
- [ ] **Task 2 — Confirm role mapping in `Program.cs`** (AC: 2)
  - [ ] If `TokenValidationParameters.RoleClaimType` isn't already the default, set it explicitly to `ClaimTypes.Role`.
- [ ] **Task 3 — Scaffold `AdminController`** (AC: 3)
  - [ ] `backend/WebCalculator.Api/Controllers/AdminController.cs` per Dev Notes.
- [ ] **Task 4 — Manual verification** (AC: 4, 5, 6)
  - [ ] Log in as `nik` → call `GET /api/admin/ping` with that token → `403`.
  - [ ] Log in as `admin` → call `GET /api/admin/ping` → `200`.
  - [ ] Call `GET /api/admin/ping` with no `Authorization` header → `401`.
- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/10.2-jwt-role-authorization`

## Dev Notes

### `AuthService.cs` — `CreateToken` diff

The existing `CreateToken` method in `backend/WebCalculator.Api/Services/AuthService.cs` builds the claims array. Add `ClaimTypes.Role`:

```csharp
// BEFORE (Story 5.2):
var claims = new[]
{
    new Claim(JwtRegisteredClaimNames.Sub, user.Username),
    new Claim("uid", user.Id.ToString()),
    new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
};

// AFTER (this story):
var claims = new[]
{
    new Claim(JwtRegisteredClaimNames.Sub, user.Username),
    new Claim("uid", user.Id.ToString()),
    new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    new Claim(ClaimTypes.Role, user.Role),   // ← new; needed for [Authorize(Roles="Admin")]
};
```

Add the missing using at the top of the file if it isn’t already there:

```csharp
using System.Security.Claims;   // ClaimTypes.Role
```

### `Program.cs` — role claim type mapping

ASP.NET Core’s JWT bearer middleware maps incoming claim names to `ClaimTypes` equivalents through `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap`. `ClaimTypes.Role` maps to the long URI `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` by default, but `[Authorize(Roles = "Admin")]` looks for `ClaimTypes.Role` — so they match automatically.

However, to be explicit and to make `User.IsInRole("Admin")` / `User.FindFirst(ClaimTypes.Role)` work reliably in controllers, add `RoleClaimType` to the existing `TokenValidationParameters` block in `Program.cs`:

```csharp
// In the AddJwtBearer block (already exists from Story 5.3):
options.TokenValidationParameters = new TokenValidationParameters
{
    // ... existing settings ...
    NameClaimType  = JwtRegisteredClaimNames.Sub,
    RoleClaimType  = ClaimTypes.Role,   // ← new; makes [Authorize(Roles="Admin")] and User.IsInRole() work
};
```

> **Why bother if it works by default?** `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap` is static and mutable — some libraries clear it. Being explicit insulates against surprises and makes intent clear for code reviewers.

### `AdminController.cs` (stub — extended in 10.3)

Create `backend/WebCalculator.Api/Controllers/AdminController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    // Story 10.2: smoke-test endpoint only — verifies the role guard is wired.
    // Can be left as a health check or removed when Story 10.3 adds real endpoints.
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { ok = true });
}
```

### Manual verification with `curl`

```bash
# Step 1 — get a User-role token (nik)
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nik","password":"5678"}' | jq -r '.token')

# Step 2 — get an Admin-role token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Expect 403:
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:5000/api/admin/ping

# Expect 200:
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/admin/ping

# Expect 401:
curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:5000/api/admin/ping
```

> If you don’t have `jq`, decode the JWT manually at [jwt.io](https://jwt.io) and paste the token. Confirm the payload contains `"role": "Admin"` for the admin login and `"role": "User"` for nik.

### Out of scope

- The actual admin business logic (list/create/delete users) — Story 10.3.
- Role-aware `GET /api/calculations` — Story 10.4.
- Frontend role decoding / route guard — Story 10.5.

### Project Structure Notes

- **MODIFY:** `backend/WebCalculator.Api/Services/AuthService.cs` (add the role claim)
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (confirm/set `RoleClaimType` mapping)
- **NEW:** `backend/WebCalculator.Api/Controllers/AdminController.cs`

### References

- [Source: PRD §9 API Surface (role claim, `/api/admin/*`); §11 C2 (superseded)](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.2](../planning-artifacts/epics.md)
- [Source: Story 5.2 — original JWT claim set](./5-2-auth-login-jwt.md)
- [Source: Story 5.3 — JWT middleware + `[Authorize]` baseline](./5-3-jwt-middleware.md)
- [Source: Story 10.1 — `User.Role` this claim reads from](./10-1-user-role-migration.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
