# Story 5.4: `POST /api/calculations` — evaluates and persists

Status: ready-for-dev

## Story

As **an authenticated user**,
I want **to POST an arithmetic expression and have the server validate it, evaluate it safely, persist it with my username and a timestamp, and return the numeric result**,
so that **PRD FR2 (calculator), FR3 (audit), and FR5 (validation) are all satisfied — and Story 6.3 can wire the FE keypad to a real backend that never runs `eval`**.

## Acceptance Criteria

1. The package `NCalc` (5.x) is installed in `WebCalculator.Api`.
2. `Models/CalculationRequest.cs` and `Models/CalculationResponse.cs` exist.
3. `Services/CalculationService.cs` exposes `CalculateAsync(expression, userId, username, ct)`. It:
   - Calls `ExpressionValidator.Validate(...)`. If invalid, returns the validation result and a `null` response — **never evaluates**.
   - Otherwise evaluates the expression with **NCalc** using **`ExpressionOptions.DecimalAsDefault`** so `7/2 = 3.5` (not `3`).
   - Persists a new `Calculation` row with `UserId`, denormalised `Username`, `Expression`, `Result` (decimal); `CreatedAt` defaults via `SYSUTCDATETIME()`.
   - Returns `(ValidationResult, CalculationResponse?)`.
4. `Controllers/CalculationsController.cs` is `[ApiController] [Authorize] [Route("api/calculations")]` and exposes `[HttpPost]`. It:
   - Reads `username = User.Identity!.Name!` (populated by the JWT middleware from the `sub` claim).
   - Reads `userId = int.Parse(User.FindFirst("uid")!.Value)`.
   - Calls `CalculationService.CalculateAsync(...)`.
   - Returns `200 { id, expression, result, createdAt, username }` on success, or `400 { reason, message }` on validation failure.
5. `CalculationService` registered as `AddScoped` in `Program.cs`.
6. End-to-end smoke: with a valid JWT (from Story 5.2's login), `POST /api/calculations` with `{ "expression": "12 + 4 * (3 - 1)" }` returns `200` and the response shows `result = 20`. Without a JWT it returns `401`.

## Tasks / Subtasks

- [ ] **Task 1 — Install NCalc** (AC: 1)
  - [ ] `dotnet add backend/WebCalculator.Api package NCalc --version 5.*`

- [ ] **Task 2 — Create the request/response models** (AC: 2)
  - [ ] `backend/WebCalculator.Api/Models/CalculationRequest.cs` per **Dev Notes → Models**.

- [ ] **Task 3 — Create the calculation service** (AC: 3)
  - [ ] `backend/WebCalculator.Api/Services/CalculationService.cs` per **Dev Notes → CalculationService content**.

- [ ] **Task 4 — Create the controller** (AC: 4)
  - [ ] `backend/WebCalculator.Api/Controllers/CalculationsController.cs` per **Dev Notes → CalculationsController content**.

- [ ] **Task 5 — Register the service** (AC: 5)
  - [ ] In `Program.cs`:
    ```csharp
    builder.Services.AddScoped<CalculationService>();
    ```

- [ ] **Task 6 — Smoke-test end-to-end** (AC: 6)
  - [ ] Start the app: `dotnet run --project backend/WebCalculator.Api`.
  - [ ] Login: `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"evi","password":"1234"}'` → capture `token`.
  - [ ] Calculate: `curl -X POST http://localhost:5000/api/calculations -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"expression":"12 + 4 * (3 - 1)"}'` → expect `result: 20`.
  - [ ] Validation failure: `... -d '{"expression":"1++2"}'` → `400 { "reason": "DoubledOperator", ... }`.
  - [ ] Without bearer: `curl ... /api/calculations -d '{...}'` → `401`.
  - [ ] Confirm a new row in `Calculations` via `sqlcmd -S "(localdb)\MSSQLLocalDB" -d WebCalculator -Q "SELECT TOP 5 * FROM Calculations ORDER BY CreatedAt DESC"`.

- [ ] **Task 7 — Open the PR**
  - [ ] Branch: `feature/5.4-calculations-post`

## Dev Notes

### Models

`backend/WebCalculator.Api/Models/CalculationRequest.cs`:

```csharp
namespace WebCalculator.Api.Models;

public record CalculationRequest(string Expression);
public record CalculationResponse(int Id, string Expression, decimal Result, DateTime CreatedAt, string Username);
```

(Both records in one file — small, related.)

### CalculationService content

`backend/WebCalculator.Api/Services/CalculationService.cs`:

```csharp
using NCalc;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;

namespace WebCalculator.Api.Services;

public class CalculationService
{
    private readonly AppDbContext _db;
    private readonly ExpressionValidator _validator;

    public CalculationService(AppDbContext db, ExpressionValidator validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<(ValidationResult validation, CalculationResponse? result)> CalculateAsync(
        string expression, int userId, string username, CancellationToken ct)
    {
        var validation = _validator.Validate(expression);
        if (!validation.IsValid) return (validation, null);

        decimal result;
        try
        {
            // DecimalAsDefault → "7/2" evaluates to 3.5m, not int 3.
            var ncalc = new Expression(expression, ExpressionOptions.DecimalAsDefault);
            result = Convert.ToDecimal(ncalc.Evaluate());
        }
        catch (Exception)
        {
            // NCalc threw on something the validator missed (e.g. overflow, weird grouping).
            return (ValidationResult.Fail(ValidationReason.BadCharacter, "Expression could not be evaluated."), null);
        }

        var calc = new Calculation
        {
            UserId = userId,
            Username = username,
            Expression = expression,
            Result = result,
            // CreatedAt set by SYSUTCDATETIME() default at insert time.
        };

        _db.Calculations.Add(calc);
        await _db.SaveChangesAsync(ct);

        return (validation, new CalculationResponse(calc.Id, calc.Expression, calc.Result, calc.CreatedAt, calc.Username));
    }
}
```

### CalculationsController content

`backend/WebCalculator.Api/Controllers/CalculationsController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/calculations")]
public class CalculationsController : ControllerBase
{
    private readonly CalculationService _service;

    public CalculationsController(CalculationService service) { _service = service; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CalculationRequest request, CancellationToken ct)
    {
        var username = User.Identity!.Name!;                                  // sub claim, set by middleware
        var userId   = int.Parse(User.FindFirst("uid")!.Value);               // uid claim from Story 5.2

        var (validation, result) = await _service.CalculateAsync(request.Expression, userId, username, ct);

        if (!validation.IsValid)
        {
            return BadRequest(new { reason = validation.Reason.ToString(), message = validation.Message });
        }

        return Ok(result);
    }
}
```

### Why `ExpressionOptions.DecimalAsDefault`

NCalc treats integer literals as `int` by default, so `7/2` evaluates to `3` (integer division). Standard calculator UX is `3.5`. `DecimalAsDefault` parses every numeric literal as `decimal` so `7/2 = 3.5m`. This matters for FR2.

### Why no `[FromBody]` validation attributes

The JSON model is just a string. The `ExpressionValidator` covers everything. Adding `[Required]` etc. on `CalculationRequest.Expression` is fine but redundant — the validator handles `null`/empty/whitespace.

### Why username is **not** in the request body

PRD §9 + Story 5.3 are explicit: "Username is always read from the JWT `sub` claim, never from the request body." Otherwise a logged-in user could spoof another user. The controller pattern enforces this — `request.Username` doesn't exist.

### Why catch the broad `Exception` after NCalc

NCalc can throw on many things (parse errors, overflow, divide-by-zero we missed). We don't want a 500 leaking the stack trace; convert to a 400 with a generic reason. This is defensive, not idiomatic — but PRD §12 risk register flags evaluator errors as a category we explicitly handle.

### Logging

Add `_logger.LogInformation` calls for happy path + validation failure if you want — not required by AC. Story 7.4 (SonarLint) might flag noisy logs; coach reviews.

### Out of scope

- Listing / searching calculations (Story 5.5).
- Frontend wiring + `eval` removal (Story 6.3).
- Tests for `CalculationService` — Story 7.1.
- Per-user history isolation — explicitly cross-user per PRD §11 C3.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Models/CalculationRequest.cs` (contains both records)
- **NEW:** `backend/WebCalculator.Api/Services/CalculationService.cs`
- **NEW:** `backend/WebCalculator.Api/Controllers/CalculationsController.cs`
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (add `AddScoped<CalculationService>()`)
- **MODIFY:** `backend/WebCalculator.Api/WebCalculator.Api.csproj` (NCalc package ref)

### References

- [Source: PRD §5 FR2, FR3, FR5; §9 API Surface; §11 C3, C6; §12 risk register](../planning-artifacts/prd.md)
- [Source: epics.md Story 5.4 + upstream Stories 5.1, 5.2, 5.3](../planning-artifacts/epics.md)
- NCalc docs: https://github.com/ncalc/ncalc

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
