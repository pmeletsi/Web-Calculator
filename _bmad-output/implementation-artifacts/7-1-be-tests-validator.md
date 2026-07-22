# Story 7.1: Backend unit tests — `ExpressionValidator` (extend) + `CalculationService`

Status: in-progress

## Story

As **the team**,
I want **xUnit tests covering all major paths through `ExpressionValidator` (extending Story 5.1) and `CalculationService` (covering POST + GET behaviour from Stories 5.4 / 5.5)**,
so that **regressions are caught locally and in CI (Story 8.1) — and the brief's "Code should be well structured and decoupled to allow the creation of unit tests" requirement is demonstrably satisfied (PRD NFR7)**.

## Acceptance Criteria

1. `ExpressionValidator` test class from Story 5.1 is reviewed and (optionally) extended with edge cases (very long input, deeply nested parens, mixed whitespace). Existing 22 cases stay green. **No new file** — extend the existing one if anything is missing.
2. New file `WebCalculator.Tests/Services/CalculationServiceTests.cs` exists with tests covering:
   - **POST happy path:** valid expression → result correct, DB row inserted with `Username` + `UserId` + `Expression` + `Result` populated.
   - **POST validation failure:** invalid expression → `ValidationResult` populated, `null` response, **no DB write**.
   - **POST decimal precision:** `7/2` returns `3.5m` (not `3`).
   - **GET ordering:** results sorted by `CreatedAt` desc.
   - **GET filtering:** `username` substring filter applied (lowercase data — see Dev Notes for case-sensitivity caveat).
   - **GET pagination:** `page=2, pageSize=10` returns the right slice; `total` reflects the full filtered count.
3. Tests use **EF Core InMemory provider** (`Microsoft.EntityFrameworkCore.InMemory`, already installed by Story 5.2). Each test gets a fresh DB via `Guid.NewGuid()` database name (full isolation).
4. Test seeding helpers manually set `CreatedAt` (the SQL Server `SYSUTCDATETIME()` default doesn't apply on InMemory).
5. `dotnet test backend/WebCalculator.sln` runs all tests green; output mentions ≥ 25 passing tests.

## Tasks / Subtasks

- [x] **Task 1 — (Optional) Review & extend the validator tests** (AC: 1)
  - [x] Open `backend/WebCalculator.Tests/Services/ExpressionValidatorTests.cs` (from Story 5.1).
  - [x] If you find a regression-worthy case missing (e.g., 1000-char expression, `((((1))))`), add a single `[InlineData]` row.
  - [x] **Do not refactor working tests** — read-only PR is fine.

- [x] **Task 2 — Create the calculation service test class** (AC: 2, 3, 4)
  - [x] `backend/WebCalculator.Tests/Services/CalculationServiceTests.cs` per **Dev Notes → Test class content**.

- [x] **Task 3 — Run + verify** (AC: 5)
  - [x] `dotnet test backend/WebCalculator.sln` → all green.
  - [ ] Optional: `dotnet test --collect:"XPlat Code Coverage"` then open the coverage report in `TestResults/`.
  - [ ] Eyeball coverage of `CalculationService` and `ExpressionValidator` — should be ≥ 90% (epic AC target).

- [ ] **Task 4 — Open the PR**
  - [ ] Branch: `feature/7.1-be-tests-validator`

## Dev Notes

### Test class content

`backend/WebCalculator.Tests/Services/CalculationServiceTests.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using WebCalculator.Api.Data;
using WebCalculator.Api.Services;
using Xunit;

namespace WebCalculator.Tests.Services;

public class CalculationServiceTests
{
    // --- helpers ---

    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static (CalculationService svc, AppDbContext db) NewSut()
    {
        var db = NewDb();
        var svc = new CalculationService(db, new ExpressionValidator());
        return (svc, db);
    }

    private static async Task<User> SeedUserAsync(AppDbContext db, string username = "evi")
    {
        var u = new User { Username = username, PasswordHash = "hash", CreatedAt = DateTime.UtcNow };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return u;
    }

    // --- POST tests ---

    [Fact]
    public async Task Calculate_valid_expression_persists_and_returns_result()
    {
        var (svc, db) = NewSut();
        var user = await SeedUserAsync(db);

        var (validation, response) = await svc.CalculateAsync(
            "12 + 4 * (3 - 1)", user.Id, user.Username, CancellationToken.None);

        Assert.True(validation.IsValid);
        Assert.NotNull(response);
        Assert.Equal(20m, response!.Result);
        Assert.Equal("12 + 4 * (3 - 1)", response.Expression);
        Assert.Equal("evi", response.Username);
        Assert.Equal(1, await db.Calculations.CountAsync());
    }

    [Theory]
    [InlineData("1++2", ValidationReason.DoubledOperator)]
    [InlineData("",      ValidationReason.Empty)]
    [InlineData("6/0",   ValidationReason.DivisionByZero)]
    [InlineData("5%3",   ValidationReason.BadCharacter)]
    public async Task Calculate_invalid_expression_does_not_persist(string expr, ValidationReason expected)
    {
        var (svc, db) = NewSut();
        var user = await SeedUserAsync(db);

        var (validation, response) = await svc.CalculateAsync(
            expr, user.Id, user.Username, CancellationToken.None);

        Assert.False(validation.IsValid);
        Assert.Equal(expected, validation.Reason);
        Assert.Null(response);
        Assert.Equal(0, await db.Calculations.CountAsync());
    }

    [Fact]
    public async Task Calculate_uses_decimal_division()
    {
        var (svc, db) = NewSut();
        var user = await SeedUserAsync(db);

        var (_, response) = await svc.CalculateAsync(
            "7/2", user.Id, user.Username, CancellationToken.None);

        Assert.Equal(3.5m, response!.Result);
    }

    // --- GET tests ---

    [Fact]
    public async Task Get_returns_calculations_ordered_desc_by_createdAt()
    {
        var (svc, db) = NewSut();
        var user = await SeedUserAsync(db);
        for (var i = 0; i < 3; i++)
        {
            db.Calculations.Add(new Calculation
            {
                UserId = user.Id, Username = user.Username,
                Expression = $"{i}+0", Result = i,
                CreatedAt = DateTime.UtcNow.AddMinutes(-i),  // older as i increases
            });
        }
        await db.SaveChangesAsync();

        var result = await svc.GetAsync(null, page: 1, pageSize: 10, CancellationToken.None);

        Assert.Equal(3, result.Total);
        Assert.Equal("0+0", result.Items[0].Expression);  // most recent
        Assert.Equal("2+0", result.Items[2].Expression);  // oldest
    }

    [Fact]
    public async Task Get_filters_by_username_substring()
    {
        var (svc, db) = NewSut();
        var evi = await SeedUserAsync(db, "evi");
        var nik = await SeedUserAsync(db, "nik");
        db.Calculations.Add(new Calculation { UserId = evi.Id, Username = "evi", Expression = "1+1", Result = 2, CreatedAt = DateTime.UtcNow });
        db.Calculations.Add(new Calculation { UserId = nik.Id, Username = "nik", Expression = "2+2", Result = 4, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var result = await svc.GetAsync("ev", page: 1, pageSize: 10, CancellationToken.None);

        Assert.Equal(1, result.Total);
        Assert.Equal("evi", result.Items[0].Username);
    }

    [Fact]
    public async Task Get_paginates_correctly()
    {
        var (svc, db) = NewSut();
        var user = await SeedUserAsync(db);
        for (var i = 0; i < 25; i++)
        {
            db.Calculations.Add(new Calculation
            {
                UserId = user.Id, Username = user.Username,
                Expression = $"{i}+0", Result = i,
                CreatedAt = DateTime.UtcNow.AddSeconds(-i),
            });
        }
        await db.SaveChangesAsync();

        var page1 = await svc.GetAsync(null, page: 1, pageSize: 10, CancellationToken.None);
        var page3 = await svc.GetAsync(null, page: 3, pageSize: 10, CancellationToken.None);

        Assert.Equal(25, page1.Total);
        Assert.Equal(10, page1.Items.Count);
        Assert.Equal(5,  page3.Items.Count);
    }
}
```

### Why EF InMemory (not SQLite)

- **EF InMemory** is intern-friendly: zero setup, no SQL dialect to wrestle with.
- **SQLite In-Memory** is closer to real SQL, but our schema uses `SYSUTCDATETIME()` defaults (Story 4.3) which SQLite doesn't recognise — `EnsureCreated` would fail or skip the default silently.
- The trade-off: EF InMemory's `EF.Functions.Like` is **case-sensitive**, while SQL Server (production) is case-insensitive by default collation. We sidestep by using **lowercase test data** (`"evi"` matches `"ev"`, both lowercase). True case-insensitivity is covered by the manual smoke test in Story 5.5.

> If the team later needs case-insensitivity to be unit-tested, switch to SQLite In-Memory and conditionally drop the `SYSUTCDATETIME()` default in test config. **Out of scope here.**

### Why per-test fresh DB

`Guid.NewGuid()` gives each test a unique InMemory database name → full isolation, no leakage between tests, no test ordering surprises. Cost: a tiny bit of extra memory per test. Worth it.

### Why we set `CreatedAt` manually in tests

The `SYSUTCDATETIME()` default is a SQL Server thing. EF InMemory doesn't apply it — `CreatedAt` would default to `DateTime.MinValue` and break the ordering test. Setting it manually in seed helpers makes test intent explicit ("this row is newer than that one").

### Coverage target

Epic AC says ≥ 90% for `ExpressionValidator` + `CalculationService`. With Story 5.1's 22 validator tests + this story's 7-ish service tests, you should comfortably clear that. Verify with:

```bash
dotnet test backend/WebCalculator.sln --collect:"XPlat Code Coverage"
```

The HTML report lands in `TestResults/<guid>/coverage.cobertura.xml`. View with `reportgenerator` (optional). For now the bar is "tests pass" — coverage gating moves to Story 8.1 (CI).

### Out of scope

- Auth service tests (Story 7.2 expands).
- Controller tests (we'd need WebApplicationFactory; not in PRD).
- Integration tests with real SQL Server (slower, requires LocalDB).
- Performance tests, load tests — not in brief.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Tests/Services/CalculationServiceTests.cs`
- **MODIFY (optional):** `backend/WebCalculator.Tests/Services/ExpressionValidatorTests.cs` (add edge cases if any are missing)

### References

- [Source: PRD §6 NFR7; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 7.1 + upstream 5.1, 5.4, 5.5](../planning-artifacts/epics.md)
- [Source: Story 5.1 (validator tests) and 5.4/5.5 (services under test)](./5-1-expression-validator.md)
- xUnit Theory + InlineData: https://xunit.net/docs/getting-started/v3/theory
- EF Core InMemory: https://learn.microsoft.com/en-us/ef/core/providers/in-memory/

## Dev Agent Record

### Agent Model Used

GitHub Copilot

### Debug Log References

- `dotnet test backend/WebCalculator.Tests/WebCalculator.Tests.csproj --no-restore -c Release --filter FullyQualifiedName~ExpressionValidatorTests` — 23 passed.
- `dotnet test backend/WebCalculator.Tests/WebCalculator.Tests.csproj --no-restore -c Release --filter FullyQualifiedName~CalculationServiceTests` — 9 passed.
- `dotnet test backend/WebCalculator.sln --no-restore -c Release` — 36 passed, 0 failed, 0 skipped.
- Release configuration was used because a running Debug API process locked `WebCalculator.Api.exe`.

### Completion Notes List

- Extended the existing MSTest validator suite with a deeply nested balanced-parentheses case without refactoring working tests.
- Added isolated EF Core InMemory CalculationService tests covering persistence fields, validation failures with no writes, decimal division, ordering, username filtering, and exact page-two pagination.
- Confirmed the complete backend solution test suite exceeds the required passing-test threshold.
- The optional coverage collector command was not run; no numeric coverage claim is recorded.

### File List

- backend/WebCalculator.Tests/Services/ExpressionValidatorTests.cs
- backend/WebCalculator.Tests/Services/CalculationServiceTests.cs
- _bmad-output/implementation-artifacts/7-1-be-tests-validator.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
