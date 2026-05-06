# Story 5.5: `GET /api/calculations` — list + search-by-user + pagination

Status: ready-for-dev

## Story

As **an authenticated user**,
I want **to GET a paginated list of calculations, optionally filtered by username**,
so that **PRD FR4 (history with search by user) is satisfied — and Story 6.4 can swap the FE History page off `localStorage` onto the real backend**.

## Acceptance Criteria

1. `Models/PagedResult.cs` exists: `public record PagedResult<T>(List<T> Items, int Total);`.
2. `CalculationService` gains `GetAsync(username, page, pageSize, ct)` returning `PagedResult<CalculationResponse>`. It:
   - Treats `username` empty/null as "no filter".
   - Filters with case-insensitive contains-match (`EF.Functions.Like(c.Username, "%term%")`).
   - Orders by `CreatedAt` desc.
   - Skips `(page-1) * pageSize`, takes `pageSize`.
   - Returns the total count of the **filtered** set (so the FE can render "1–20 of 87").
3. `CalculationsController` gains `[HttpGet]` mapping to `GetAsync`. Query params:
   - `username` — optional string.
   - `page` — defaults to `1`; values `< 1` clamp to `1`.
   - `pageSize` — defaults to `20`; values `< 1` or `> 100` clamp to `20`.
4. `[Authorize]` from Story 5.4 (controller-level) covers the GET; without a bearer header → `401`.
5. End-to-end smoke: with a valid JWT, `GET /api/calculations?page=1&pageSize=10` returns `200` with the most recent 10 (or fewer) calculations and a non-zero `total`. With `?username=ev`, the items are limited to usernames containing "ev".

## Tasks / Subtasks

- [ ] **Task 1 — Add the `PagedResult` record** (AC: 1)
  - [ ] `backend/WebCalculator.Api/Models/PagedResult.cs`:
    ```csharp
    namespace WebCalculator.Api.Models;
    public record PagedResult<T>(List<T> Items, int Total);
    ```

- [ ] **Task 2 — Add `GetAsync` to `CalculationService`** (AC: 2)
  - [ ] Edit `backend/WebCalculator.Api/Services/CalculationService.cs` per **Dev Notes → `GetAsync`**.

- [ ] **Task 3 — Add `[HttpGet]` to `CalculationsController`** (AC: 3, 4)
  - [ ] Add the action per **Dev Notes → Controller action**.

- [ ] **Task 4 — Smoke-test end-to-end** (AC: 5)
  - [ ] Start the app and login (Story 5.2 captures the token).
  - [ ] Submit 3-4 calculations via Story 5.4 to populate.
  - [ ] `curl -H "Authorization: Bearer <token>" "http://localhost:5000/api/calculations?page=1&pageSize=10"` → JSON with `items` ordered desc by `createdAt`, and `total` = number of rows.
  - [ ] `curl -H "Authorization: Bearer <token>" "http://localhost:5000/api/calculations?username=ev"` → only rows where `Username` contains `ev`.
  - [ ] No bearer → `401`.

- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/5.5-calculations-get`

## Dev Notes

### `GetAsync`

Add to `backend/WebCalculator.Api/Services/CalculationService.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
// ... other usings already present from 5.4

public async Task<PagedResult<CalculationResponse>> GetAsync(
    string? username, int page, int pageSize, CancellationToken ct)
{
    var query = _db.Calculations.AsNoTracking().AsQueryable();

    if (!string.IsNullOrWhiteSpace(username))
    {
        var term = $"%{username}%";
        query = query.Where(c => EF.Functions.Like(c.Username, term));
    }

    var total = await query.CountAsync(ct);

    var items = await query
        .OrderByDescending(c => c.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(c => new CalculationResponse(c.Id, c.Expression, c.Result, c.CreatedAt, c.Username))
        .ToListAsync(ct);

    return new PagedResult<CalculationResponse>(items, total);
}
```

### Controller action

Add to `backend/WebCalculator.Api/Controllers/CalculationsController.cs`:

```csharp
[HttpGet]
public async Task<IActionResult> List(
    [FromQuery] string? username,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    CancellationToken ct = default)
{
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 20;

    var result = await _service.GetAsync(username, page, pageSize, ct);
    return Ok(result);
}
```

### Why `EF.Functions.Like`

`EF.Functions.Like(col, "%term%")` translates to a SQL Server `LIKE` clause that, with the default collation `SQL_Latin1_General_CP1_CI_AS`, is **case-insensitive**. The `IX_Calculations_Username` index (Story 4.3) supports prefix matching (e.g. `'ev%'`) but not contains (`'%ev%'`); for an intern exercise the table won't grow large enough for that to matter, and the simplest predicate wins (PRD §11 C6).

### Why `AsNoTracking`

This is a read-only query — we never need EF's change-tracking. `AsNoTracking()` skips the bookkeeping and is faster + cheaper for list endpoints. Junior-friendly default for any read-only query.

### Why count the **filtered** set

PRD §9 response shape is `{ items, total }`. The FE uses `total` to render "1–20 of N" (wireframe 2.4). If the user filters by `username=ev`, the total should reflect the filtered set, not the table size — otherwise the pagination control is wrong.

### Why clamp `pageSize` to 100

Open-ended `pageSize` is a small DoS surface (someone could request `pageSize=10_000_000`). Clamping at 100 keeps the worst case bounded. PRD §9 lists the default 20 + max 100; we honour both.

### Why server-side clamping (not [Range] attributes)

`[Range]` attributes return 400 on out-of-range, which is unnecessary friction (the FE would have to re-call). Silent clamping (with the value documented in API docs / Swagger) is more forgiving. PRD §11 C6 — keep it boring.

### Out of scope

- Sorting by other fields (only `CreatedAt desc` per PRD).
- Per-user isolation — explicitly cross-user (PRD §11 C3).
- CSV export, advanced filters — not in PRD §5.
- Tests for the GET path — Story 7.1 expands `CalculationServiceTests`.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Models/PagedResult.cs`
- **MODIFY:** `backend/WebCalculator.Api/Services/CalculationService.cs` (add `GetAsync`)
- **MODIFY:** `backend/WebCalculator.Api/Controllers/CalculationsController.cs` (add `List` action)

### References

- [Source: PRD §5 FR4; §9 API Surface; §11 C3, C6; §13 Q2 (page-size default)](../planning-artifacts/prd.md)
- [Source: epics.md Story 5.5 + downstream Story 6.4](../planning-artifacts/epics.md)
- EF Core `EF.Functions.Like`: https://learn.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.dbfunctionsextensions.like
- EF Core `AsNoTracking`: https://learn.microsoft.com/en-us/ef/core/querying/tracking#no-tracking-queries

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
