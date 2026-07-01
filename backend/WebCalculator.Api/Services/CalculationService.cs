using NCalc;
using WebCalculator.Api.Data;
using WebCalculator.Api.Models;

namespace WebCalculator.Api.Services;

public class CalculationService
{
    private readonly AppDbContext _db;
    private readonly ExpressionValidator _validator;

    public CalculationService(AppDbContext db, ExpressionValidator validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<(ValidationResult validation, CalculationResponse? result)> CalculateAsync(
        string expression, int userId, string username, CancellationToken ct)
    {
        var validation = _validator.Validate(expression);
        if (!validation.IsValid) return (validation, null);

        decimal result;
        try
        {
            // DecimalAsDefault → "7/2" evaluates to 3.5m, not int 3.
            var ncalc = new Expression(expression, ExpressionOptions.DecimalAsDefault);
            result = Convert.ToDecimal(ncalc.Evaluate());
        }
        catch (Exception)
        {
            // NCalc threw on something the validator missed (e.g. overflow, weird grouping).
            return (ValidationResult.Fail(ValidationReason.BadCharacter, "Expression could not be evaluated."), null);
        }

        var calc = new Calculation
        {
            UserId = userId,
            Username = username,
            Expression = expression,
            Result = result,
        };

        _db.Calculations.Add(calc);
        await _db.SaveChangesAsync(ct);

        return (validation, new CalculationResponse(calc.Id, calc.Expression, calc.Result, calc.CreatedAt, calc.Username));
    }
}
