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
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<User> SeedAsync(
        AppDbContext db,
        string username = "evi",
        string role = "User")
    {
        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
            Role = role,
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return user;
    }

    [TestMethod]
    public async Task List_does_not_include_password_hash()
    {
        using var db = NewDb();
        await SeedAsync(db);

        var service = new AdminUserService(db);

        var result = await service.ListAsync(
            CancellationToken.None);

        Assert.AreEqual(1, result.Count);

        var propertyNames = typeof(AdminUserResponse)
            .GetProperties()
            .Select(property => property.Name);

        Assert.IsFalse(
            propertyNames.Any(name =>
                name.Contains(
                    "Password",
                    StringComparison.OrdinalIgnoreCase)));
    }

    [TestMethod]
    public async Task List_returns_all_users_ordered_by_username()
    {
        using var db = NewDb();
        await SeedAsync(db, "nik");
        await SeedAsync(db, "evi");

        var service = new AdminUserService(db);

        var result = await service.ListAsync(
            CancellationToken.None);

        Assert.AreEqual(2, result.Count);
        Assert.AreEqual("evi", result[0].Username);
        Assert.AreEqual("nik", result[1].Username);
    }

    [TestMethod]
    public async Task Create_new_user_succeeds()
    {
        using var db = NewDb();
        var service = new AdminUserService(db);

        var (conflict, created) =
            await service.CreateAsync(
                new AdminUserRequest(
                    "newuser",
                    "pass1",
                    "User"),
                CancellationToken.None);

        Assert.IsFalse(conflict);
        Assert.IsNotNull(created);
        Assert.AreEqual("newuser", created.Username);
        Assert.AreEqual("User", created.Role);
        Assert.AreEqual(1, await db.Users.CountAsync());
    }

    [TestMethod]
    public async Task Create_duplicate_username_returns_conflict()
    {
        using var db = NewDb();
        await SeedAsync(db, "existing");

        var service = new AdminUserService(db);

        var (conflict, created) =
            await service.CreateAsync(
                new AdminUserRequest(
                    "existing",
                    "pass1",
                    "User"),
                CancellationToken.None);

        Assert.IsTrue(conflict);
        Assert.IsNull(created);
        Assert.AreEqual(1, await db.Users.CountAsync());
    }

    [TestMethod]
    public async Task Create_hashes_password_before_storing()
    {
        using var db = NewDb();
        var service = new AdminUserService(db);

        await service.CreateAsync(
            new AdminUserRequest(
                "newuser",
                "plaintext",
                "User"),
            CancellationToken.None);

        var stored = await db.Users.SingleAsync();

        Assert.AreNotEqual(
            "plaintext",
            stored.PasswordHash);

        Assert.IsTrue(
            BCrypt.Net.BCrypt.Verify(
                "plaintext",
                stored.PasswordHash));
    }

    [TestMethod]
    public async Task Delete_existing_user_without_history_returns_deleted()
    {
        using var db = NewDb();
        var user = await SeedAsync(db);

        var service = new AdminUserService(db);

        var result = await service.DeleteAsync(
            user.Id,
            callerId: 999,
            CancellationToken.None);

        Assert.AreEqual(
            AdminDeleteResult.Deleted,
            result);

        Assert.AreEqual(
            0,
            await db.Users.CountAsync());
    }

    [TestMethod]
    public async Task Delete_nonexistent_user_returns_not_found()
    {
        using var db = NewDb();
        var service = new AdminUserService(db);

        var result = await service.DeleteAsync(
            id: 42,
            callerId: 1,
            CancellationToken.None);

        Assert.AreEqual(
            AdminDeleteResult.NotFound,
            result);
    }

    [TestMethod]
    public async Task Delete_self_returns_cannot_delete_self()
    {
        using var db = NewDb();
        var user = await SeedAsync(db);

        var service = new AdminUserService(db);

        var result = await service.DeleteAsync(
            user.Id,
            callerId: user.Id,
            CancellationToken.None);

        Assert.AreEqual(
            AdminDeleteResult.CannotDeleteSelf,
            result);

        Assert.AreEqual(
            1,
            await db.Users.CountAsync());
    }

    [TestMethod]
    public async Task Delete_last_admin_is_permitted_by_service()
    {
        using var db = NewDb();
        var admin = await SeedAsync(
            db,
            "admin",
            "Admin");

        var service = new AdminUserService(db);

        var result = await service.DeleteAsync(
            admin.Id,
            callerId: 999,
            CancellationToken.None);

        Assert.AreEqual(
            AdminDeleteResult.Deleted,
            result);
    }
}