using System.ComponentModel.DataAnnotations;

namespace WebCalculator.Api.Data;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = "";

    [Required, MaxLength(256)]
    public string PasswordHash { get; set; } = "";

    [Required, MaxLength(20)]
    public string Role { get; set; } = "User";

    public DateTime CreatedAt { get; set; }

    // Navigation
    public List<Calculation> Calculations { get; set; } = new();
}