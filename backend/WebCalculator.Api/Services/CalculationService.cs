using Microsoft.EntityFrameworkCore;
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
        var (validation, previewResult) = Preview(expression);
        if (!validation.IsValid || previewResult is null) return (validation, null);

        var result = previewResult.Value;

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

    public (ValidationResult validation, decimal? result) Preview(string expression)
    {
        var validation = _validator.Validate(expression);
        if (!validation.IsValid) return (validation, null);

        try
        {
            var ncalc = new Expression(expression, ExpressionOptions.DecimalAsDefault);
            return (validation, Convert.ToDecimal(ncalc.Evaluate()));
        }
        catch (DivideByZeroException)
        {
            return (ValidationResult.Fail(
                ValidationReason.DivisionByZero,
                "Division by Zero: Δεν επιτρέπεται η διαίρεση με το μηδέν."), null);
        }
        catch (Exception)
        {
            return (ValidationResult.Fail(
                ValidationReason.BadCharacter,
                "Syntax Error: Η εξίσωση έχει λανθασμένη μορφή."), null);
        }
    }

    public async Task<PagedResult<CalculationResponse>> GetAsync(
        string? username, int page, int pageSize, CancellationToken ct)
    {
        var query = _db.Calculations.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(username))
        {
            var term = $"%{username}%";
            query = query.Where(c => EF.Functions.Like(c.Username, term));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CalculationResponse(c.Id, c.Expression, c.Result, c.CreatedAt, c.Username))
            .ToListAsync(ct);

        return new PagedResult<CalculationResponse>(items, total);
    }

    public Task<int> DeleteAllAsync(CancellationToken ct)
    {
        return _db.Calculations.ExecuteDeleteAsync(ct);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var deleted = await _db.Calculations
            .Where(c => c.Id == id)
            .ExecuteDeleteAsync(ct);

        return deleted > 0;
    }
}
