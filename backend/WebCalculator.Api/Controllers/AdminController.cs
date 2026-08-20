using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AdminUserService _userService;

    public AdminController(AdminUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { ok = true });
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> ListUsers(CancellationToken ct)
    {
        var users = await _userService.ListAsync(ct);
        return Ok(users);
    }

    // POST /api/admin/users
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(
        [FromBody] AdminUserRequest request,
        CancellationToken ct)
    {
        if (request.Role is not ("User" or "Admin"))
        {
            return BadRequest(new
            {
                error = "Role must be \"User\" or \"Admin\"."
            });
        }

        var (conflict, created) =
            await _userService.CreateAsync(request, ct);

        if (conflict)
        {
            return Conflict(new
            {
                error = $"Username '{request.Username}' is already taken."
            });
        }

        return CreatedAtAction(nameof(ListUsers), created);
    }

    // DELETE /api/admin/users/{id}
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(
        int id,
        CancellationToken ct)
    {
        var callerIdStr = User.FindFirst("uid")?.Value;

        if (!int.TryParse(callerIdStr, out var callerId))
        {
            return Unauthorized();
        }

        var result = await _userService.DeleteAsync(
            id,
            callerId,
            ct);

        return result switch
        {
            AdminDeleteResult.Deleted =>
                NoContent(),

            AdminDeleteResult.NotFound =>
                NotFound(),

            AdminDeleteResult.HasHistory =>
                Conflict(new
                {
                    error = "Cannot delete a user with existing calculation history."
                }),

            AdminDeleteResult.CannotDeleteSelf =>
                BadRequest(new
                {
                    error = "You cannot delete your own account."
                }),

            _ => StatusCode(500)
        };
    }
}