using Microsoft.EntityFrameworkCore;

namespace WebCalculator.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

}
