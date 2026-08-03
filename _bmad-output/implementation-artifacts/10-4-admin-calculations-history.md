# Story 10.4: Role-aware calculation history — Admins can view any/all users

Status: ready-for-dev

## Story

As **an Admin**,
I want **to view any user's (or every user's) calculation history through the existing history endpoint**,
so that **the training brief's "view all users' history" requirement is met without duplicating the History feature behind a second endpoint**.

## Acceptance Criteria

1. `GET /api/calculations` (Story 5.5) becomes role-aware:
   - Caller with **`User`** role: the `username` query filter, if provided, is **ignored** — results are always scoped to the caller's own username (from the JWT). Omitting the filter also returns only the caller's own history. This closes a pre-existing gap where any authenticated user could pass another user's `username` and read their history.
   - Caller with **`Admin`** role: `username` filter behaves as documented in Story 5.5 (filters to that user if provided); if omitted, returns calculations **across all users**, newest first, still paginated by `page`/`pageSize`.
2. No change to the response shape (`{ items, total }`) or to `POST`/`DELETE` endpoints on `CalculationsController` — those remain owner-only, unaffected by this story.
3. Existing FE calls from `pages/History.jsx` (Story 6.4, a `User`-role caller viewing their own history) continue to work unmodified.

## Tasks / Subtasks

- [ ] **Task 1 — Read the caller's role in `CalculationsController.List`** (AC: 1)
  - [ ] `var role = User.FindFirst(ClaimTypes.Role)?.Value;` alongside the existing username claim lookup.
- [ ] **Task 2 — Enforce scoping before calling the service** (AC: 1)
  - [ ] If `role != "Admin"`, overwrite the `username` parameter with the caller's own username before calling `_service.GetAsync(...)`, regardless of what was passed in the query string.
- [ ] **Task 3 — Manual verification** (AC: 1, 2, 3)
  - [ ] As `nik`: `GET /api/calculations?username=evi` → returns **nik's** own history, not evi's.
  - [ ] As `nik`: `GET /api/calculations` (no filter) → returns nik's own history (unchanged from before).
  - [ ] As `admin`: `GET /api/calculations` (no filter) → rows from every user.
  - [ ] As `admin`: `GET /api/calculations?username=evi` → only evi's rows.
  - [ ] Existing FE History page (logged in as `evi` or `nik`) still shows the same results as before this story.
- [ ] **Task 4 — Open the PR**
  - [ ] Branch: `feature/10.4-admin-calculations-history`

## Dev Notes

### Why extend the existing endpoint instead of adding `GET /api/admin/calculations`?

`CalculationService.GetAsync` already does exactly the query + pagination Epic 10 needs (Story 5.5). A parallel `AdminController` endpoint would duplicate that logic for no benefit, and would need its own tests. Making the existing endpoint role-aware is the smallest change consistent with PRD §11 C6 (avoid unnecessary layers/duplication).

### `CalculationsController.cs` — `List` action, full replacement

Replace only the `List` action (the others are unchanged). Find it by its `[HttpGet]` attribute:

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

    // Role-aware scoping (Story 10.4):
    // Non-admins can only ever see their own calculations, regardless of the query param.
    var role = User.FindFirst(ClaimTypes.Role)?.Value;
    if (role != "Admin")
    {
        username = User.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value
                ?? User.FindFirst(ClaimTypes.Name)?.Value;
    }
    // Admins: username filter applies as-is (null → all users, value → filtered)

    var result = await _service.GetAsync(username, page, pageSize, ct);
    return Ok(result);
}
```

Add the missing using at the top of the file if not already present:

```csharp
using System.Security.Claims;   // ClaimTypes.Role, ClaimTypes.Name
```

### Claim key lookup note

`JwtRegisteredClaimNames.UniqueName` maps to the `"unique_name"` claim, which the existing `AuthService.CreateToken` sets from `user.Username` (Story 5.2). `User.FindFirst(ClaimTypes.Name)` is the fallback for when `DefaultInboundClaimTypeMap` maps it to the long URI form. The existing controllers already use `User.FindFirst(JwtRegisteredClaimNames.UniqueName)` for username lookups (see `CalculationsController.Create`) — follow the same pattern.

### What to verify before opening the PR

```bash
# Log in as nik (User role)
NIK_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nik","password":"5678"}' | jq -r '.token')

# Attempt to snoop evi's history — must return nik's own history, NOT evi's
curl -s -H "Authorization: Bearer $NIK_TOKEN" \
  "http://localhost:5000/api/calculations?username=evi" | jq '.items[].username'
# All values must be "nik"

# Log in as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Admin sees everyone's history when no filter
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:5000/api/calculations" | jq '[.items[].username] | unique'
# Should contain "evi", "nik", etc.

# Admin filter by evi — only evi's rows
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:5000/api/calculations?username=evi" | jq '.items[].username'
# All values must be "evi"
```

### Security note

This story fixes a latent authorization gap introduced by Story 5.5 (any authenticated user could pass someone else's `username` and read their history). Flag this explicitly in the PR description — it's a security fix riding along with the admin feature, not just new functionality.

### Out of scope

- Frontend `AdminHistory.jsx` — Story 10.7.
- Changes to `POST`/`DELETE` on `CalculationsController` — those stay owner-only.
- Automated tests — Story 10.8.

### Project Structure Notes

- **MODIFY:** `backend/WebCalculator.Api/Controllers/CalculationsController.cs` (role-aware `List` action only)

### References

- [Source: PRD §5 FR8, FR9; §9 API Surface; §11 C3 (tightened)](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.4](../planning-artifacts/epics.md)
- [Source: Story 5.5 — original `GET /api/calculations` this extends](./5-5-calculations-get.md)
- [Source: Story 10.2 — role claim this reads](./10-2-jwt-role-authorization.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
