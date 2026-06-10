using System.ComponentModel.DataAnnotations;

namespace WebCalculator.Api.Data;

public class Calculation
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = "";

    [Required, MaxLength(200)]
    public string Expression { get; set; } = "";

    public decimal Result { get; set; }

    public DateTime CreatedAt { get; set; }
}
