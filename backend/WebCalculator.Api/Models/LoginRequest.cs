using System.ComponentModel.DataAnnotations;

namespace WebCalculator.Api.Models;

public record LoginRequest(
    [property: Required, MaxLength(50)] string Username,
    [property: Required, MaxLength(256)] string Password);

public record LoginResponse(string Token, string Username, DateTime ExpiresAt);
