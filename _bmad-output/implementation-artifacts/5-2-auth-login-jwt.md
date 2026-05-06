# Story 5.2: `POST /api/auth/login` issues a JWT (+ stateless `/logout`)

Status: ready-for-dev

## Story

As **an authorized user**,
I want **to POST my username + password and receive a JWT in return**,
so that **the FE can authenticate me (Story 6.2) and subsequent API calls (Stories 5.4 / 5.5) carry my identity via the bearer token (PRD FR1)**.

## Acceptance Criteria

1. The package `Microsoft.AspNetCore.Authentication.JwtBearer` (8.x) is installed in `WebCalculator.Api`. (Brings `Microsoft.IdentityModel.Tokens` + `System.IdentityModel.Tokens.Jwt` along.)
2. JWT settings exist in `appsettings.json` and per-env files:
   - `Jwt:Issuer` = `WebCalculator`
   - `Jwt:Audience` = `WebCalculator`
   - `Jwt:LifetimeMinutes` = `60`
   - `Jwt:Key` = a clearly-marked dev value in `appsettings.Development.json`; `REPLACE_VIA_ENVVAR_OR_USER_SECRETS` in `appsettings.Production.json`.
3. `Models/LoginRequest.cs` and `Models/LoginResponse.cs` (records) exist.
4. `Services/AuthService.cs` exposes `LoginAsync(username, password, ct)` returning `LoginResponse?` (null on bad creds). It:
   - Looks up the user via `AppDbContext`.
   - Verifies the password with `BCrypt.Net.BCrypt.Verify`.
   - Issues a JWT signed HS256 with claims `sub` = username, `uid` = user.Id, `jti` = new GUID, `exp` = configurable.
5. `Controllers/AuthController.cs` exposes:
   - `POST /api/auth/login` — calls `AuthService.LoginAsync`. Returns `200 { token, username }` on success, `401` on bad creds (no detail leak — same response for "user not found" and "wrong password").
   - `POST /api/auth/logout` — public, returns `204` (stateless JWT — server has nothing to do; the FE deletes the token).
6. `AuthService` registered as `AddScoped` in `Program.cs`.
7. xUnit test in `AuthServiceTests` covers: login success returns token + username; login wrong password returns null; login unknown user returns null.

## Tasks / Subtasks

- [ ] **Task 1 — Install the JWT package** (AC: 1)
  - [ ] `dotnet add backend/WebCalculator.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.*`

- [ ] **Task 2 — Add Jwt config to appsettings** (AC: 2)
  - [ ] In `appsettings.json`, add the `Jwt` block per **Dev Notes → appsettings additions**.
  - [ ] In `appsettings.Development.json`, add `Jwt:Key` per Dev Notes (the dev-only value).
  - [ ] In `appsettings.Production.json`, add `Jwt:Key = REPLACE_VIA_ENVVAR_OR_USER_SECRETS`.
  - [ ] (Optional) `dotnet user-secrets set "Jwt:Key" "<random-32-or-more-char-string>" --project backend/WebCalculator.Api`

- [ ] **Task 3 — Create the request/response models** (AC: 3)
  - [ ] `backend/WebCalculator.Api/Models/LoginRequest.cs` and `LoginResponse.cs` per **Dev Notes → Models**.

- [ ] **Task 4 — Create the auth service** (AC: 4)
  - [ ] `backend/WebCalculator.Api/Services/AuthService.cs` per **Dev Notes → AuthService content**.

- [ ] **Task 5 — Create the auth controller** (AC: 5)
  - [ ] `backend/WebCalculator.Api/Controllers/AuthController.cs` per **Dev Notes → AuthController content**.

- [ ] **Task 6 — Register the service** (AC: 6)
  - [ ] In `Program.cs`, alongside the validator registration:
    ```csharp
    builder.Services.AddScoped<AuthService>();
    ```

- [ ] **Task 7 — Write the test class** (AC: 7)
  - [ ] `backend/WebCalculator.Tests/Services/AuthServiceTests.cs` per **Dev Notes → Test content** — uses `Microsoft.EntityFrameworkCore.InMemory` for the DB.

- [ ] **Task 8 — Verify**
  - [ ] `dotnet build backend/WebCalculator.sln` → 0 warnings.
  - [ ] `dotnet test backend/WebCalculator.sln` → all green.
  - [ ] Manual: start the app, `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"evi","password":"1234"}'` → `200` with token in body. Wrong password → `401`.

- [ ] **Task 9 — Open the PR**
  - [ ] Branch: `feature/5.2-auth-login-jwt`

## Dev Notes

### appsettings additions

`appsettings.json` — common defaults (Issuer, Audience, Lifetime):

```json
{
  "Jwt": {
    "Issuer": "WebCalculator",
    "Audience": "WebCalculator",
    "LifetimeMinutes": 60
  }
}
```

`appsettings.Development.json` — dev-only key (committed; safe because it's clearly marked dev-only):

```json
{
  "Jwt": {
    "Key": "dev-only-key-DO-NOT-USE-IN-PROD-32chars-minimum"
  }
}
```

`appsettings.Production.json` — placeholder, real value via env var or User Secrets (consistent with D7):

```json
{
  "Jwt": {
    "Key": "REPLACE_VIA_ENVVAR_OR_USER_SECRETS"
  }
}
```

> **Why the dev key can be committed:** it's clearly labelled dev-only and shorter than the 32-char minimum is OK for HS256 since we are not in prod. The prod key MUST be ≥ 32 chars and random.

### Models

`backend/WebCalculator.Api/Models/LoginRequest.cs`:

```csharp
namespace WebCalculator.Api.Models;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username);
```

(Both records in one file is fine — keep small, single-concept files together.)

### AuthService content

`backend/WebCalculator.Api/Services/AuthService.cs`:

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;

namespace WebCalculator.Api.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(string username, string password, CancellationToken ct)
    {
        var user = await _db.Users.SingleOrDefaultAsync(u => u.Username == username, ct);
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

        var token = IssueJwt(user);
        return new LoginResponse(token, user.Username);
    }

    private string IssueJwt(User user)
    {
        var key = _config["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key missing.");
        var issuer = _config["Jwt:Issuer"] ?? "WebCalculator";
        var audience = _config["Jwt:Audience"] ?? "WebCalculator";
        var lifetimeMinutes = int.Parse(_config["Jwt:LifetimeMinutes"] ?? "60");

        var symmetricKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(symmetricKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Username),
            new Claim("uid", user.Id.ToString()),               // used by Story 5.4 to set Calculation.UserId
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(lifetimeMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### AuthController content

`backend/WebCalculator.Api/Controllers/AuthController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth) { _auth = auth; }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return Unauthorized();

        var result = await _auth.LoginAsync(request.Username, request.Password, ct);
        if (result is null) return Unauthorized();

        return Ok(result);
    }

    // Stateless JWT — server has no token revocation list. Client deletes its token.
    // The endpoint exists for API symmetry (PRD §9).
    [HttpPost("logout")]
    public IActionResult Logout() => NoContent();
}
```

### Test content

`backend/WebCalculator.Tests/Services/AuthServiceTests.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WebCalculator.Api.Data;
using WebCalculator.Api.Services;
using Xunit;

namespace WebCalculator.Tests.Services;

public class AuthServiceTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static IConfiguration NewConfig() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"]              = "test-key-test-key-test-key-test-key-32!",
            ["Jwt:Issuer"]           = "WebCalculator",
            ["Jwt:Audience"]         = "WebCalculator",
            ["Jwt:LifetimeMinutes"]  = "60",
        })
        .Build();

    private static async Task SeedAsync(AppDbContext db)
    {
        db.Users.Add(new User
        {
            Username = "evi",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Login_with_correct_password_returns_token()
    {
        using var db = NewDb();
        await SeedAsync(db);
        var sut = new AuthService(db, NewConfig());

        var result = await sut.LoginAsync("evi", "1234", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("evi", result!.Username);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_null()
    {
        using var db = NewDb();
        await SeedAsync(db);
        var sut = new AuthService(db, NewConfig());

        var result = await sut.LoginAsync("evi", "wrong", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_with_unknown_user_returns_null()
    {
        using var db = NewDb();
        await SeedAsync(db);
        var sut = new AuthService(db, NewConfig());

        var result = await sut.LoginAsync("ghost", "1234", CancellationToken.None);

        Assert.Null(result);
    }
}
```

The test uses EF Core's `InMemory` provider — install once: `dotnet add backend/WebCalculator.Tests package Microsoft.EntityFrameworkCore.InMemory`.

### Why `uid` claim

PRD §8 says `Calculation.UserId` is an FK. The cleanest path from request → DB is to read `uid` from the JWT (Story 5.4) instead of doing an extra lookup against `Users`. Tucking `uid` into the token here means the rest of Epic 5 doesn't need to touch `Users` again per request.

### Why no `[Authorize]` on logout

Stateless JWT logout is a client-side concern (delete the token). The server has nothing to do. Making the endpoint public means even an expired-token request can call it without error — the response is the same `204` either way. PRD §9 lists it as `bearer` but for symmetry; we relax it for simplicity. (Alternative: add `[AllowAnonymous]` after `[Authorize]` is applied app-wide — same effect.)

### Out of scope

- Bearer middleware that protects `/api/calculations/*` — Story 5.3.
- The `/api/calculations` endpoints themselves — Stories 5.4 / 5.5.
- Frontend wiring — Stories 6.1 / 6.2.
- Refresh tokens — PRD Q1 (deferred to coach).

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Models/LoginRequest.cs` (contains both records)
- **NEW:** `backend/WebCalculator.Api/Services/AuthService.cs`
- **NEW:** `backend/WebCalculator.Api/Controllers/AuthController.cs`
- **NEW:** `backend/WebCalculator.Tests/Services/AuthServiceTests.cs`
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (add `AddScoped<AuthService>()`)
- **MODIFY:** `backend/WebCalculator.Api/appsettings.json` + `.Development.json` + `.Production.json` (add `Jwt` block)
- **MODIFY:** `backend/WebCalculator.Api/WebCalculator.Api.csproj` (1 new package ref)
- **MODIFY:** `backend/WebCalculator.Tests/WebCalculator.Tests.csproj` (`Microsoft.EntityFrameworkCore.InMemory` package ref)

### References

- [Source: PRD §5 FR1, FR6; §9 API Surface; §13 Q1 (lifetime open question)](../planning-artifacts/prd.md)
- [Source: epics.md Story 5.2 + Story 4.4 (BCrypt seeding) + Story 5.3 (middleware)](../planning-artifacts/epics.md)
- ASP.NET Core JWT bearer auth: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn
- BCrypt.Net-Next: https://github.com/BcryptNet/bcrypt.net
- EF Core InMemory provider (testing only): https://learn.microsoft.com/en-us/ef/core/providers/in-memory/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
