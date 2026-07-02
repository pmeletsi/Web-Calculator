using Microsoft.AspNetCore.Mvc;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, ct);
        if (result is null)
        {
            return Unauthorized(new { error = "Invalid username or password." });
        }

        return Ok(result);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Stateless JWT: nothing to revoke server-side; the client discards the token.
        return NoContent();
    }
}
