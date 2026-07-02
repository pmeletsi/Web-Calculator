namespace WebCalculator.Api.Models;

public record CalculationRequest(string Expression);
public record CalculationResponse(int Id, string Expression, decimal Result, DateTime CreatedAt, string Username);
