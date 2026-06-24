using Microsoft.EntityFrameworkCore;

namespace WebCalculator.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Calculation> Calculations => Set<Calculation>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Users
        mb.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        mb.Entity<User>()
            .Property(u => u.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        // Calculations
        mb.Entity<Calculation>()
            .HasIndex(c => c.Username)
            .HasDatabaseName("IX_Calculations_Username");

        mb.Entity<Calculation>()
            .Property(c => c.Result)
            .HasColumnType("decimal(18,6)");

        mb.Entity<Calculation>()
            .Property(c => c.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        mb.Entity<Calculation>()
            .HasOne(c => c.User)
            .WithMany(u => u.Calculations)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }

}
