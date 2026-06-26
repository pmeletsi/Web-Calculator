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

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);
        db.Users.Add(new User
        {
            Id = 1,
            Username = "evi",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(ValidPassword),
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

        var result = await service.LoginAsync(new LoginRequest("evi", ValidPassword));

        Assert.IsNotNull(result);
        Assert.AreEqual("evi", result!.Username);
        Assert.IsFalse(string.IsNullOrWhiteSpace(result.Token));
        Assert.IsTrue(result.ExpiresAt > DateTime.UtcNow);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        Assert.AreEqual("WebCalculator", jwt.Issuer);
        Assert.AreEqual("evi", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.UniqueName).Value);
    }

    [TestMethod]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(new LoginRequest("evi", "wrong-password"));

        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task LoginAsync_UnknownUser_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(new LoginRequest("ghost", ValidPassword));

        Assert.IsNull(result);
    }
}
