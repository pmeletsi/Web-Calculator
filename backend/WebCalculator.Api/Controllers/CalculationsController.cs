using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
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
        var userId   = int.Parse(User.Identity!.Name!);                       // Sub claim = user.Id (set by middleware)
        var username = User.FindFirst(JwtRegisteredClaimNames.UniqueName)!.Value;

        var (validation, result) = await _service.CalculateAsync(request.Expression, userId, username, ct);

        if (!validation.IsValid)
        {
            return BadRequest(new { reason = validation.Reason.ToString(), message = validation.Message });
        }

        return Ok(result);
    }
}
