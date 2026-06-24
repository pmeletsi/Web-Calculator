using Microsoft.EntityFrameworkCore;
using WebCalculator.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
// TODO(5.3): CORS for the Vite dev server origin.

var app = builder.Build();

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<AppDbContext>();
    var logger = sp.GetRequiredService<ILogger<Program>>();

    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(db, logger);
}

app.Run();