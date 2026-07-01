namespace WebCalculator.Api.Models;

public record PagedResult<T>(List<T> Items, int Total);
