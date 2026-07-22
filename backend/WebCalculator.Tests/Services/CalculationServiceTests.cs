using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebCalculator.Api.Data;
using WebCalculator.Api.Services;

namespace WebCalculator.Tests.Services;

[TestClass]
public class CalculationServiceTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static (CalculationService service, AppDbContext db) NewSut()
    {
        var db = NewDb();
        var service = new CalculationService(db, new ExpressionValidator());
        return (service, db);
    }

    private static async Task<User> SeedUserAsync(AppDbContext db, string username = "evi")
    {
        var user = new User
        {
            Username = username,
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [TestMethod]
    public async Task Calculate_valid_expression_persists_and_returns_result()
    {
        var (service, db) = NewSut();
        var user = await SeedUserAsync(db);
        const string expression = "12 + 4 * (3 - 1)";

        var (validation, response) = await service.CalculateAsync(
            expression, user.Id, user.Username, CancellationToken.None);

        Assert.IsTrue(validation.IsValid);
        Assert.IsNotNull(response);
        Assert.AreEqual(20m, response.Result);
        Assert.AreEqual(expression, response.Expression);
        Assert.AreEqual(user.Username, response.Username);

        var saved = await db.Calculations.SingleAsync();
        Assert.AreEqual(user.Id, saved.UserId);
        Assert.AreEqual(user.Username, saved.Username);
        Assert.AreEqual(expression, saved.Expression);
        Assert.AreEqual(20m, saved.Result);
    }

    [DataTestMethod]
    [DataRow("1++2", ValidationReason.DoubledOperator)]
    [DataRow("", ValidationReason.Empty)]
    [DataRow("6/0", ValidationReason.DivisionByZero)]
    [DataRow("5%3", ValidationReason.BadCharacter)]
    public async Task Calculate_invalid_expression_does_not_persist(
        string expression, ValidationReason expected)
    {
        var (service, db) = NewSut();
        var user = await SeedUserAsync(db);

        var (validation, response) = await service.CalculateAsync(
            expression, user.Id, user.Username, CancellationToken.None);

        Assert.IsFalse(validation.IsValid);
        Assert.AreEqual(expected, validation.Reason);
        Assert.IsNull(response);
        Assert.AreEqual(0, await db.Calculations.CountAsync());
    }

    [TestMethod]
    public async Task Calculate_uses_decimal_division()
    {
        var (service, db) = NewSut();
        var user = await SeedUserAsync(db);

        var (validation, response) = await service.CalculateAsync(
            "7/2", user.Id, user.Username, CancellationToken.None);

        Assert.IsTrue(validation.IsValid);
        Assert.IsNotNull(response);
        Assert.AreEqual(3.5m, response.Result);
    }

    [TestMethod]
    public async Task Get_returns_calculations_ordered_desc_by_createdAt()
    {
        var (service, db) = NewSut();
        var user = await SeedUserAsync(db);
        var now = DateTime.UtcNow;

        for (var i = 0; i < 3; i++)
        {
            db.Calculations.Add(new Calculation
            {
                UserId = user.Id,
                Username = user.Username,
                Expression = $"{i}+0",
                Result = i,
                CreatedAt = now.AddMinutes(-i),
            });
        }

        await db.SaveChangesAsync();

        var result = await service.GetAsync(
            null, page: 1, pageSize: 10, CancellationToken.None);

        Assert.AreEqual(3, result.Total);
        Assert.AreEqual("0+0", result.Items[0].Expression);
        Assert.AreEqual("2+0", result.Items[2].Expression);
    }

    [TestMethod]
    public async Task Get_filters_by_username_substring()
    {
        var (service, db) = NewSut();
        var evi = await SeedUserAsync(db, "evi");
        var nik = await SeedUserAsync(db, "nik");
        var now = DateTime.UtcNow;

        db.Calculations.AddRange(
            new Calculation
            {
                UserId = evi.Id,
                Username = evi.Username,
                Expression = "1+1",
                Result = 2,
                CreatedAt = now,
            },
            new Calculation
            {
                UserId = nik.Id,
                Username = nik.Username,
                Expression = "2+2",
                Result = 4,
                CreatedAt = now.AddSeconds(-1),
            });
        await db.SaveChangesAsync();

        var result = await service.GetAsync(
            "ev", page: 1, pageSize: 10, CancellationToken.None);

        Assert.AreEqual(1, result.Total);
        Assert.AreEqual(1, result.Items.Count);
        Assert.AreEqual("evi", result.Items[0].Username);
    }

    [TestMethod]
    public async Task Get_paginates_page_two_and_preserves_total()
    {
        var (service, db) = NewSut();
        var user = await SeedUserAsync(db);
        var now = DateTime.UtcNow;

        for (var i = 0; i < 25; i++)
        {
            db.Calculations.Add(new Calculation
            {
                UserId = user.Id,
                Username = user.Username,
                Expression = $"{i}+0",
                Result = i,
                CreatedAt = now.AddSeconds(-i),
            });
        }

        await db.SaveChangesAsync();

        var result = await service.GetAsync(
            null, page: 2, pageSize: 10, CancellationToken.None);

        Assert.AreEqual(25, result.Total);
        Assert.AreEqual(10, result.Items.Count);
        Assert.AreEqual("10+0", result.Items[0].Expression);
        Assert.AreEqual("19+0", result.Items[9].Expression);
    }
}
