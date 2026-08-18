using Microsoft.EntityFrameworkCore;

namespace WebCalculator.Api.Data;

public static class DataSeeder
{
    private static readonly (string Username, string Password, string Role)[] ScriptedUsers =
    {
        ("evi", "1234", "User"),
        ("nik", "5678", "User"),
        ("admin", "admin123", "Admin"),
    };

    public static async Task<int> SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            logger.LogInformation("Seed skipped: Users table already populated.");
            return 0;
        }

        foreach (var u in ScriptedUsers)
        {
            db.Users.Add(new User
            {
                Username = u.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password),
                Role = u.Role,
            });
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Count} users.", ScriptedUsers.Length);
        return ScriptedUsers.Length;
    }
}