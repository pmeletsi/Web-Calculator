var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// TODO(4.2): builder.Services.AddDbContext<AppDbContext>(...);
// TODO(5.3): CORS for the Vite dev server origin.

var app = builder.Build();

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));
app.MapControllers();

app.Run();