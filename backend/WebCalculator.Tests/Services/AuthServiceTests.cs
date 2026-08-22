using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Tests.Services;

[TestClass]
public class AuthServiceTests
{
    private const string ValidPassword = "1234";

    private static AppDbContext CreateDb(
        string username = "evi",
        string password = ValidPassword,
        string role = "User")
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);

        db.Users.Add(new User
        {
            Id = 1,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        });

        db.SaveChanges();

        return db;
    }

    private static IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "WebCalculator",
                ["Jwt:Audience"] = "WebCalculatorClient",
                ["Jwt:LifetimeMinutes"] = "60",
                ["Jwt:Key"] = "unit-test-super-secret-jwt-signing-key-32+chars"
            })
            .Build();

    [TestMethod]
    public async Task LoginAsync_ValidCredentials_ReturnsTokenWithUsername()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("evi", ValidPassword));

        Assert.IsNotNull(result);
        Assert.AreEqual("evi", result!.Username);
        Assert.IsFalse(string.IsNullOrWhiteSpace(result.Token));
        Assert.IsTrue(result.ExpiresAt > DateTime.UtcNow);

        var jwt = new JwtSecurityTokenHandler()
            .ReadJwtToken(result.Token);

        Assert.AreEqual("WebCalculator", jwt.Issuer);

        Assert.AreEqual(
            "evi",
            jwt.Claims
                .First(c => c.Type == JwtRegisteredClaimNames.UniqueName)
                .Value);
    }

    [TestMethod]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("evi", "wrong-password"));

        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task LoginAsync_UnknownUser_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("ghost", ValidPassword));

        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task LoginAsync_ValidCredentials_TokenContainsExpectedClaims()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("evi", ValidPassword));

        Assert.IsNotNull(result);

        var token = new JwtSecurityTokenHandler()
            .ReadJwtToken(result!.Token);

        Assert.AreEqual(
            "evi",
            token.Claims
                .First(c => c.Type == JwtRegisteredClaimNames.Sub)
                .Value);

        Assert.AreEqual(
            "1",
            token.Claims
                .First(c => c.Type == "uid")
                .Value);

        Assert.IsFalse(
            string.IsNullOrEmpty(
                token.Claims
                    .FirstOrDefault(
                        c => c.Type == JwtRegisteredClaimNames.Jti)
                    ?.Value));
    }

    [TestMethod]
    public async Task LoginAsync_ValidCredentials_TokenExpiresWithinConfiguredLifetime()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("evi", ValidPassword));

        Assert.IsNotNull(result);

        var now = DateTime.UtcNow;

        var token = new JwtSecurityTokenHandler()
            .ReadJwtToken(result!.Token);

        Assert.IsTrue(token.ValidTo > now);
        Assert.IsTrue(token.ValidTo < now.AddMinutes(61));
    }

    [DataTestMethod]
    [DataRow("", ValidPassword)]
    [DataRow("evi", "")]
    [DataRow("", "")]
    public async Task LoginAsync_EmptyCredentials_ReturnsNull(
        string username,
        string password)
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest(username, password));

        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task LoginAsync_StoredHashForDifferentPassword_ReturnsNull()
    {
        using var db = CreateDb();

        var user = await db.Users
            .SingleAsync(u => u.Username == "evi");

        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword("a-different-password");

        await db.SaveChangesAsync();

        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("evi", ValidPassword));

        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task LoginAsync_AdminUser_TokenContainsAdminRoleClaim()
    {
        using var db = CreateDb(
            username: "admin",
            password: "adminpass",
            role: "Admin");

        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(
            new LoginRequest("admin", "adminpass"));

        Assert.IsNotNull(result);

        var token = new JwtSecurityTokenHandler()
            .ReadJwtToken(result!.Token);

        var roleClaim = token.Claims.FirstOrDefault(c =>
            c.Type == "role" ||
            c.Type ==
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");

        Assert.IsNotNull(roleClaim);
        Assert.AreEqual("Admin", roleClaim!.Value);
    }
}