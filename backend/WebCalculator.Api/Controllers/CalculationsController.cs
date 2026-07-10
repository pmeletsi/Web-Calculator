using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WebCalculator.Api.Models;
using WebCalculator.Api.Services;

namespace WebCalculator.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/calculations")]
public class CalculationsController : ControllerBase
{
    private readonly CalculationService _service;

    public CalculationsController(CalculationService service) { _service = service; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CalculationRequest request, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.Identity?.Name;
        var username = User.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value
            ?? User.FindFirst(ClaimTypes.Name)?.Value;

        if (!int.TryParse(userIdClaim, out var userId) || string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var (validation, result) = await _service.CalculateAsync(request.Expression, userId, username, ct);

        if (!validation.IsValid)
        {
            return BadRequest(new { reason = validation.Reason.ToString(), message = validation.Message });
        }

        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? username,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var result = await _service.GetAsync(username, page, pageSize, ct);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken ct)
    {
        var deleted = await _service.DeleteAllAsync(ct);
        return Ok(new { deleted });
    }
}
