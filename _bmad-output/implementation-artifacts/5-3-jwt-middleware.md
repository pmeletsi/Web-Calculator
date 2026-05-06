# Story 5.3: JWT bearer middleware + CORS allow-list

Status: ready-for-dev

## Story

As **the team**,
I want **JWT bearer authentication wired into the request pipeline and a configurable CORS allow-list**,
so that **`[Authorize]` on the calculations controller (Story 5.4) actually rejects unauthenticated requests with 401, and the FE dev server (Story 6.x) can call the API across origins**.

## Acceptance Criteria

1. JWT bearer authentication is configured in `Program.cs` reading `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` from `IConfiguration`. `NameClaimType` is set to `JwtRegisteredClaimNames.Sub` so `User.Identity.Name` returns the username inside controllers.
2. `app.UseAuthentication()` and `app.UseAuthorization()` are added to the request pipeline (in that order, **after** `UseCors`).
3. CORS is configured from `Cors:AllowedOrigins` in `appsettings`. Development includes `http://localhost:5173` (the Vite dev server). Production uses `REPLACE_VIA_ENVVAR_OR_USER_SECRETS`-style placeholder.
4. The order in `Program.cs` is: `UseSwagger` (dev only) → `UseCors("Frontend")` → `UseAuthentication()` → `UseAuthorization()` → `MapControllers()`.
5. Build succeeds (`dotnet build backend/WebCalculator.sln`); the `/healthz` endpoint still returns 200 to anonymous requests.
6. Verification: a smoke test (manual or scripted) hits the not-yet-built `/api/calculations` and gets 404 (controller doesn't exist yet — Story 5.4) — but Swagger UI shows the **Authorize** button (proving middleware registered). Once Story 5.4 lands, the same endpoint will return 401 without a bearer header.

## Tasks / Subtasks

- [ ] **Task 1 — Add CORS settings to appsettings** (AC: 3)
  - [ ] In `appsettings.Development.json`, add the `Cors` block per **Dev Notes → CORS settings**.
  - [ ] In `appsettings.Production.json`, add the placeholder version.

- [ ] **Task 2 — Configure JWT auth in `Program.cs`** (AC: 1)
  - [ ] Add the `using` directives and the `AddAuthentication(...).AddJwtBearer(...)` block per **Dev Notes → Program.cs additions**.
  - [ ] Add `builder.Services.AddAuthorization();` immediately after.

- [ ] **Task 3 — Configure CORS in `Program.cs`** (AC: 3)
  - [ ] Add the `AddCors(...)` block per **Dev Notes → Program.cs additions**.

- [ ] **Task 4 — Add the middleware in the pipeline** (AC: 2, 4)
  - [ ] After `var app = builder.Build();` (and after the dev-only `UseSwagger` block):
    ```csharp
    app.UseCors("Frontend");
    app.UseAuthentication();
    app.UseAuthorization();
    ```
  - [ ] Order matters — `UseCors` before the auth middlewares.

- [ ] **Task 5 — Verify** (AC: 5, 6)
  - [ ] `dotnet build backend/WebCalculator.sln` → 0 warnings.
  - [ ] `dotnet run --project backend/WebCalculator.Api` → starts.
  - [ ] `curl http://localhost:5000/healthz` → `200` (still anonymous).
  - [ ] Open Swagger UI at `http://localhost:5000/swagger` → "Authorize" button visible at top right.
  - [ ] (After Story 5.4) `curl http://localhost:5000/api/calculations` → `401`.

- [ ] **Task 6 — Open the PR**
  - [ ] Branch: `feature/5.3-jwt-middleware`

## Dev Notes

### CORS settings

`appsettings.Development.json`:

```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

`appsettings.Production.json`:

```json
{
  "Cors": {
    "AllowedOrigins": ["REPLACE_VIA_ENVVAR_OR_USER_SECRETS"]
  }
}
```

> The `Cors__AllowedOrigins__0` env var lets ops override per-deploy without code changes (PRD NFR6).

### Program.cs additions

Add these `using` directives at the top of `Program.cs`:

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
```

Inside `builder.Services` registrations, add:

```csharp
// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key missing.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = JwtRegisteredClaimNames.Sub,
        };
    });
builder.Services.AddAuthorization();
```

Pipeline (after `var app = builder.Build();` and after the dev-only Swagger block):

```csharp
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
```

### Why `NameClaimType = Sub`

By default, ASP.NET Core looks for `ClaimTypes.Name` in the token to populate `User.Identity.Name`. Our token uses `JwtRegisteredClaimNames.Sub` (the JWT standard claim for the subject = username). Setting `NameClaimType = Sub` makes `User.Identity!.Name!` return the username directly inside controllers (Story 5.4 reads it).

### Why CORS comes BEFORE Authentication

The CORS middleware must inspect the request **before** auth rejects it, otherwise pre-flight `OPTIONS` requests get blocked with 401 and the browser never sees the CORS headers it needs to allow the real request. ASP.NET Core docs are explicit about this order.

### Swagger UI Authorize button

`AddSwaggerGen` from Story 4.1 doesn't yet wire the bearer auth scheme into Swagger UI. To make the "Authorize" button accept a JWT, optionally extend the `AddSwaggerGen` call:

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header — `Bearer {token}`",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        [ new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
            Reference = new Microsoft.OpenApi.Models.OpenApiReference {
                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                Id = "Bearer"
            }} ] = new List<string>()
    });
});
```

This is a nice-to-have for testing endpoints from Swagger UI. Skip if it slows you down — the AC only requires the button to be present (which `AddSwaggerGen` alone gives you indirectly via the security definition).

### What this story does NOT verify end-to-end

The calculations controller doesn't exist yet (Story 5.4). The full "401 without bearer, 200 with valid bearer" round-trip happens once 5.4 lands. This story leaves the pipeline ready.

### Out of scope

- The actual calculations endpoints (Stories 5.4 / 5.5).
- Refresh tokens / token revocation (PRD Q1).
- Rate limiting, request throttling — not in PRD.
- HTTPS enforcement (`UseHttpsRedirection`) — left at template default; coach can enable later.

### Project Structure Notes

- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (add CORS + JWT middleware blocks)
- **MODIFY:** `backend/WebCalculator.Api/appsettings.Development.json` (add `Cors`)
- **MODIFY:** `backend/WebCalculator.Api/appsettings.Production.json` (add `Cors` placeholder)
- **NEW:** none

### References

- [Source: PRD §5 FR1, FR3; §6 NFR6; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 5.3 + downstream Story 5.4](../planning-artifacts/epics.md)
- ASP.NET Core JWT bearer config: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication
- ASP.NET Core CORS: https://learn.microsoft.com/en-us/aspnet/core/security/cors
- Middleware ordering: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
