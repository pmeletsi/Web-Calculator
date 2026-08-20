using System.ComponentModel.DataAnnotations;

namespace WebCalculator.Api.Models;

public record AdminUserRequest(
    [Required, MaxLength(50)] string Username,
    [Required, MinLength(4), MaxLength(128)] string Password,
    [Required] string Role
);

public record AdminUserResponse(
    int Id,
    string Username,
    string Role,
    DateTime CreatedAt
);