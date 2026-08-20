using Microsoft.EntityFrameworkCore;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;

namespace WebCalculator.Api.Services;

public enum AdminDeleteResult
{
    Deleted,
    NotFound,
    HasHistory,
    CannotDeleteSelf
}

public class AdminUserService
{
    private readonly AppDbContext _db;

    public AdminUserService(AppDbContext db)
    {
        _db = db;
    }

    // GET - List all users
    public async Task<List<AdminUserResponse>> ListAsync(CancellationToken ct) =>
        await _db.Users
            .OrderBy(u => u.Username)
            .Select(u => new AdminUserResponse(
                u.Id,
                u.Username,
                u.Role,
                u.CreatedAt))
            .ToListAsync(ct);

    // POST - Create user
    public async Task<(bool Conflict, AdminUserResponse? Created)> CreateAsync(
        AdminUserRequest request,
        CancellationToken ct)
    {
        var exists = await _db.Users
            .AnyAsync(u =>
                u.Username.ToLower() == request.Username.ToLower(), ct);

        if (exists)
            return (true, null);

        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return (
            false,
            new AdminUserResponse(
                user.Id,
                user.Username,
                user.Role,
                user.CreatedAt)
        );
    }

    // DELETE - Delete user
    public async Task<AdminDeleteResult> DeleteAsync(
        int id,
        int callerId,
        CancellationToken ct)
    {
        if (id == callerId)
            return AdminDeleteResult.CannotDeleteSelf;

        var user = await _db.Users.FindAsync(
            new object[] { id }, ct);

        if (user is null)
            return AdminDeleteResult.NotFound;

        _db.Users.Remove(user);

        try
        {
            await _db.SaveChangesAsync(ct);
            return AdminDeleteResult.Deleted;
        }
        catch (DbUpdateException)
        {
            _db.Entry(user).State = EntityState.Unchanged;
            return AdminDeleteResult.HasHistory;
        }
    }
}