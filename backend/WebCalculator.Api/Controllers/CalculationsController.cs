using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        var username = User.Identity!.Name!;                                  // unique_name claim, set by middleware
        var userId   = int.Parse(User.FindFirst("uid")!.Value);              

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
}
