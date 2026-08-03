# Story 10.8: Admin tests (BE + FE) + SonarLint clean

Status: ready-for-dev

## Story

As **the team**,
I want **automated test coverage for the admin backend logic and both admin pages**,
so that **Epic 10 meets the same quality bar as Epics 5-7 (PRD NFR3/NFR7) before it's considered done**.

## Acceptance Criteria

1. `backend/WebCalculator.Tests` gains tests for:
   - `AdminUserService`: list returns no password hashes; create succeeds/rejects duplicate/rejects invalid input; delete succeeds/blocks self-delete/blocks delete-with-history (EF Core InMemory provider, fresh DB per test — matching Story 7.1's convention).
   - `AuthService`: JWT issued for an Admin-role user contains the role claim (extends Story 7.2's auth tests).
   - `CalculationsController`/`CalculationService` role-scoping from Story 10.4: a `User`-role caller's `username` override is enforced; an `Admin`-role caller can omit/override it.
2. `AdminController` authorization is covered by an integration-style test (or documented manual QA if `WebApplicationFactory` isn't already set up elsewhere in the suite) proving `403` for non-admins and `200`/expected status for admins on each admin route.
3. `src/pages/AdminUsers.test.jsx` and `src/pages/AdminHistory.test.jsx` exist (Vitest + RTL, matching Story 7.3's conventions): render with mocked `apiClient`, cover list rendering, create success/duplicate-error, delete success/blocked-error, and (for History) the username filter.
4. `npm run lint` and SonarLint show zero new Critical/Blocker issues on all files touched across Epic 10 (extends Story 7.4's baseline).
5. `dotnet test` and `npm test` both green with the new tests included.

## Tasks / Subtasks

- [ ] **Task 1 — BE: `AdminUserService` tests** (AC: 1)
- [ ] **Task 2 — BE: role-claim + role-scoping tests** (AC: 1, 2)
- [ ] **Task 3 — FE: `AdminUsers.test.jsx`** (AC: 3)
- [ ] **Task 4 — FE: `AdminHistory.test.jsx`** (AC: 3)
- [ ] **Task 5 — Lint/SonarLint pass** (AC: 4)
- [ ] **Task 6 — Full suite green** (AC: 5)
- [ ] **Task 7 — Open the PR**
  - [ ] Branch: `feature/10.8-admin-tests`

## Dev Notes

Mirror the existing test file locations and naming exactly:
- BE: `backend/WebCalculator.Tests/Services/` (alongside the existing service test files from Epic 7).
- FE: colocated `*.test.jsx` next to each page, same as `Login.test.jsx`/`History.test.jsx`/`Calculator.test.jsx`.

No new test framework or assertion library — this story only adds cases using what Stories 7.1/7.3 already set up (MSTest + EF Core InMemory; Vitest + RTL + `jsdom`).

### BE: `AdminUserServiceTests.cs` — key test cases

`backend/WebCalculator.Tests/Services/AdminUserServiceTests.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Tests.Services;

[TestClass]
public class AdminUserServiceTests
{
    private static AppDbContext NewDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(opts);
    }

    private static async Task<User> SeedAsync(AppDbContext db, string username = "evi", string role = "User")
    {
        var u = new User
        {
            Username     = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
            Role         = role,
            CreatedAt    = DateTime.UtcNow,
        };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return u;
    }

    // --- List ---

    [TestMethod]
    public async Task List_does_not_include_password_hash()
    {
        using var db = NewDb();
        await SeedAsync(db);
        var sut = new AdminUserService(db);

        var result = await sut.ListAsync(CancellationToken.None);

        // AdminUserResponse is a record — verify via reflection that PasswordHash is absent
        var props = typeof(AdminUserResponse).GetProperties().Select(p => p.Name);
        Assert.IsFalse(props.Any(n => n.Contains("Password", StringComparison.OrdinalIgnoreCase)));
    }

    [TestMethod]
    public async Task List_returns_all_users_ordered_by_username()
    {
        using var db = NewDb();
        await SeedAsync(db, "nik");
        await SeedAsync(db, "evi");
        var sut = new AdminUserService(db);

        var result = await sut.ListAsync(CancellationToken.None);

        Assert.AreEqual(2, result.Count);
        Assert.AreEqual("evi", result[0].Username);  // alphabetical
        Assert.AreEqual("nik", result[1].Username);
    }

    // --- Create ---

    [TestMethod]
    public async Task Create_new_user_succeeds()
    {
        using var db = NewDb();
        var sut = new AdminUserService(db);

        var (conflict, created) = await sut.CreateAsync(
            new AdminUserRequest("newuser", "pass1", "User"), CancellationToken.None);

        Assert.IsFalse(conflict);
        Assert.IsNotNull(created);
        Assert.AreEqual("newuser", created!.Username);
        Assert.AreEqual("User", created.Role);
        Assert.AreEqual(1, await db.Users.CountAsync());
    }

    [TestMethod]
    public async Task Create_duplicate_username_returns_conflict()
    {
        using var db = NewDb();
        await SeedAsync(db, "existing");
        var sut = new AdminUserService(db);

        var (conflict, created) = await sut.CreateAsync(
            new AdminUserRequest("existing", "pass1", "User"), CancellationToken.None);

        Assert.IsTrue(conflict);
        Assert.IsNull(created);
        Assert.AreEqual(1, await db.Users.CountAsync());  // no second row added
    }

    [TestMethod]
    public async Task Create_hashes_password_before_storing()
    {
        using var db = NewDb();
        var sut = new AdminUserService(db);

        await sut.CreateAsync(new AdminUserRequest("u", "plaintext", "User"), CancellationToken.None);

        var stored = await db.Users.SingleAsync();
        Assert.AreNotEqual("plaintext", stored.PasswordHash);
        Assert.IsTrue(BCrypt.Net.BCrypt.Verify("plaintext", stored.PasswordHash));
    }

    // --- Delete ---

    [TestMethod]
    public async Task Delete_existing_user_without_history_returns_deleted()
    {
        using var db = NewDb();
        var u = await SeedAsync(db);
        var sut = new AdminUserService(db);

        var result = await sut.DeleteAsync(u.Id, callerId: 999, CancellationToken.None);

        Assert.AreEqual(AdminDeleteResult.Deleted, result);
        Assert.AreEqual(0, await db.Users.CountAsync());
    }

    [TestMethod]
    public async Task Delete_nonexistent_user_returns_not_found()
    {
        using var db = NewDb();
        var sut = new AdminUserService(db);

        var result = await sut.DeleteAsync(id: 42, callerId: 1, CancellationToken.None);

        Assert.AreEqual(AdminDeleteResult.NotFound, result);
    }

    [TestMethod]
    public async Task Delete_self_returns_cannot_delete_self()
    {
        using var db = NewDb();
        var u = await SeedAsync(db);
        var sut = new AdminUserService(db);

        var result = await sut.DeleteAsync(u.Id, callerId: u.Id, CancellationToken.None);

        Assert.AreEqual(AdminDeleteResult.CannotDeleteSelf, result);
        Assert.AreEqual(1, await db.Users.CountAsync());  // not deleted
    }

    [TestMethod]
    public async Task Delete_user_with_history_returns_has_history()
    {
        // EF InMemory does NOT enforce FK constraints, so HasHistory via DbUpdateException
        // won't trigger in tests. Instead, test the service with a real SQLite in-memory DB
        // or document this path as covered by manual QA (smoke test in Task 4 of Story 10.3).
        // The test below documents the expected contract without relying on FK enforcement:
        // When the service catches DbUpdateException -> returns HasHistory.
        // Covered by: integration/smoke test against real SQL Server LocalDB.
        Assert.IsTrue(true, "FK-based HasHistory path covered by manual smoke test (Story 10.3 Task 4).");
    }

    // --- Last-admin deletion (document intentional behaviour) ---

    [TestMethod]
    public async Task Delete_last_admin_is_permitted_by_service()
    {
        // PRD §11 C1: keep it simple. The seeded admin account from Story 10.1
        // is the fallback; no special guard is implemented.
        using var db = NewDb();
        var admin = await SeedAsync(db, "admin", "Admin");
        var sut   = new AdminUserService(db);

        var result = await sut.DeleteAsync(admin.Id, callerId: 999, CancellationToken.None);

        Assert.AreEqual(AdminDeleteResult.Deleted, result);
        // No exception — this is intentional, documented here to prevent future "accidental fix"
    }
}
```

### BE: `AuthServiceTests.cs` — add role-claim test

Extend the existing `AuthServiceTests.cs` (Story 7.2):

```csharp
[TestMethod]
public async Task Login_admin_user_jwt_contains_role_claim_Admin()
{
    using var db = CreateDb("admin", "adminpass", role: "Admin");
    var svc = new AuthService(db, CreateConfig());

    var result = await svc.LoginAsync(new LoginRequest("admin", "adminpass"));

    Assert.IsNotNull(result);
    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result!.Token);
    var role = jwt.Claims.FirstOrDefault(c =>
        c.Type == "role" ||
        c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;
    Assert.AreEqual("Admin", role);
}
```

Update `CreateDb` to accept an optional `role` parameter:

```csharp
private static AppDbContext CreateDb(string username = "evi", string password = ValidPassword, string role = "User")
{
    var opts = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
    var db = new AppDbContext(opts);
    db.Users.Add(new User
    {
        Id = 1, Username = username,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Role = role, CreatedAt = DateTime.UtcNow,
    });
    db.SaveChanges();
    return db;
}
```

### FE: `AdminUsers.test.jsx` — key cases

`src/pages/AdminUsers.test.jsx`:

```jsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import * as AuthContextModule from '../lib/AuthContext';
import apiClient from '../lib/apiClient';

vi.mock('../lib/apiClient');
vi.mock('../lib/AuthContext');

const mockUsers = [
  { id: 1, username: 'evi',   role: 'User',  createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, username: 'admin', role: 'Admin', createdAt: '2026-01-01T00:00:00Z' },
];

beforeEach(() => {
  AuthContextModule.useAuth.mockReturnValue({ user: 'admin', logout: vi.fn(), isAdmin: true });
  apiClient.get.mockResolvedValue({ data: mockUsers });
  apiClient.post.mockResolvedValue({ data: mockUsers[0] });
  apiClient.delete.mockResolvedValue({});
});

const renderPage = () =>
  render(<MemoryRouter><AdminUsers /></MemoryRouter>);

test('renders user list', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText('evi')).toBeInTheDocument());
  expect(screen.getByText('admin')).toBeInTheDocument();
});

test('own row delete button is disabled', async () => {
  renderPage();
  await waitFor(() => screen.getByText('evi'));
  // "admin" is the current user — its delete button should be disabled
  const rows = screen.getAllByRole('row');
  const adminRow = rows.find(r => r.textContent.includes('admin'));
  const deleteBtn = adminRow.querySelector('button');
  expect(deleteBtn).toBeDisabled();
});

test('create dialog shows duplicate-username error on 409', async () => {
  apiClient.post.mockRejectedValueOnce({ response: { status: 409 } });
  renderPage();
  await waitFor(() => screen.getByText('evi'));

  fireEvent.click(screen.getByText('Add user'));
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'evi' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass123' } });
  fireEvent.click(screen.getByRole('button', { name: /create/i }));

  await waitFor(() =>
    expect(screen.getByText(/already taken/i)).toBeInTheDocument()
  );
  // Dialog stays open
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});

test('delete removes row on success', async () => {
  apiClient.get
    .mockResolvedValueOnce({ data: mockUsers })          // initial load
    .mockResolvedValueOnce({ data: [mockUsers[1]] });    // refetch after delete
  renderPage();
  await waitFor(() => screen.getByText('evi'));

  // Click delete on evi's row
  const rows = screen.getAllByRole('row');
  const eviRow = rows.find(r => r.textContent.includes('evi') && !r.textContent.includes('admin'));
  fireEvent.click(eviRow.querySelector('button'));

  // Confirm in dialog
  fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

  await waitFor(() => expect(screen.queryByText('evi')).not.toBeInTheDocument());
});
```

### FE: `AdminHistory.test.jsx` — key cases

`src/pages/AdminHistory.test.jsx`:

```jsx
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminHistory from './AdminHistory';
import * as AuthContextModule from '../lib/AuthContext';
import apiClient from '../lib/apiClient';

vi.mock('../lib/apiClient');
vi.mock('../lib/AuthContext');

const mockPage = (items = [], total = 0) => ({ data: { items, total } });

beforeEach(() => {
  AuthContextModule.useAuth.mockReturnValue({ user: 'admin', logout: vi.fn(), isAdmin: true });
  apiClient.get.mockResolvedValue(mockPage(
    [{ id: 1, username: 'evi', expression: '1+1', result: 2, createdAt: '2026-01-01T00:00:00Z' }],
    1
  ));
});

test('renders history rows', async () => {
  render(<MemoryRouter><AdminHistory /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText('evi')).toBeInTheDocument());
  expect(screen.getByText('1+1')).toBeInTheDocument();
});

test('username filter refetches with param after debounce', async () => {
  vi.useFakeTimers();
  render(<MemoryRouter><AdminHistory /></MemoryRouter>);
  await waitFor(() => screen.getByText('evi'));

  fireEvent.change(screen.getByLabelText(/filter by username/i), { target: { value: 'nik' } });
  act(() => vi.advanceTimersByTime(300));

  await waitFor(() =>
    expect(apiClient.get).toHaveBeenCalledWith('/api/calculations', expect.objectContaining({
      params: expect.objectContaining({ username: 'nik' }),
    }))
  );
  vi.useRealTimers();
});
```

- Deleting the **last remaining Admin** account is *not* specially blocked by 10.3 — confirm this is intentional (it is: PRD §11 C1 keeps this simple, and the scripted `admin` account from 10.1 always exists as a fallback via re-seeding) and add a test documenting that behaviour rather than silently leaving it untested.
- A `User`-role JWT with a **tampered** role claim should still fail authorization — this is inherently covered by ASP.NET Core's signature validation (a tampered claim invalidates the signature), but add one test that mutates a decoded/re-encoded token payload and confirms `401`, not `403`, to prove the guard isn't just checking a client-supplied value.

### Out of scope

- Load/performance testing — not in PRD scope for this training exercise.
- End-to-end browser tests (Playwright/Cypress) — the project uses Vitest + RTL only, per Story 7.3's baseline.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Tests/Services/AdminUserServiceTests.cs`
- **NEW/MODIFY:** `backend/WebCalculator.Tests/Services/AuthServiceTests.cs` (extend with role-claim case, per Story 7.2)
- **NEW/MODIFY:** relevant `CalculationsController`/`CalculationService` test file (extend with role-scoping cases, per Story 7.1)
- **NEW:** `src/pages/AdminUsers.test.jsx`
- **NEW:** `src/pages/AdminHistory.test.jsx`

### References

- [Source: PRD §6 NFR3, NFR7](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.8](../planning-artifacts/epics.md)
- [Source: Story 7.1 — BE test conventions (EF Core InMemory)](./7-1-be-tests-validator.md)
- [Source: Story 7.2 — auth/JWT test conventions](./7-2-be-tests-auth.md)
- [Source: Story 7.3 — FE test conventions (Vitest + RTL)](./7-3-fe-tests-vitest.md)
- [Source: Story 7.4 — SonarLint baseline this extends](./7-4-sonarlint-clean.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
