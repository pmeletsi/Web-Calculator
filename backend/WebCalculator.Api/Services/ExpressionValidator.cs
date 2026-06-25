using System.Text.RegularExpressions;

namespace WebCalculator.Api.Services;

public enum ValidationReason
{
    Valid,
    Empty,
    BadCharacter,
    UnbalancedParens,
    TrailingOperator,
    DoubledOperator,
    DoubledDecimal,
    DivisionByZero,
}

public record ValidationResult(bool IsValid, ValidationReason Reason, string? Message = null)
{
    public static ValidationResult Ok() => new(true, ValidationReason.Valid);
    public static ValidationResult Fail(ValidationReason r, string msg) => new(false, r, msg);
}

public class ExpressionValidator
{
    // Whitelist: digits, decimal point, whitespace, + - * / ( )
    private static readonly Regex Whitelist        = new(@"^[\d+\-*/().\s]+$",      RegexOptions.Compiled);
    private static readonly Regex TrailingOperator = new(@"[+\-*/.]\s*$",           RegexOptions.Compiled);
    private static readonly Regex DoubledOperator  = new(@"[+\-*/]{2,}",            RegexOptions.Compiled);
    private static readonly Regex DivisionByZero   = new(@"/\s*0(?![\d.])",         RegexOptions.Compiled);

    public ValidationResult Validate(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
            return ValidationResult.Fail(ValidationReason.Empty, "Expression is empty.");

        if (!Whitelist.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.BadCharacter, "Expression contains an unsupported character.");

        if (TrailingOperator.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.TrailingOperator, "Expression ends with an operator.");

        // Allow `--` (negation pattern); reject other doubled operators.
        if (DoubledOperator.IsMatch(expression.Replace("--", "")))
            return ValidationResult.Fail(ValidationReason.DoubledOperator, "Two operators in a row.");

        if (expression.Contains(".."))
            return ValidationResult.Fail(ValidationReason.DoubledDecimal, "Two decimal points in a row.");

        // Balanced parentheses
        var depth = 0;
        foreach (var c in expression)
        {
            if (c == '(') depth++;
            else if (c == ')') depth--;
            if (depth < 0)
                return ValidationResult.Fail(ValidationReason.UnbalancedParens, "Unbalanced parentheses.");
        }
        if (depth != 0)
            return ValidationResult.Fail(ValidationReason.UnbalancedParens, "Unbalanced parentheses.");

        if (DivisionByZero.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.DivisionByZero, "Division by zero.");

        return ValidationResult.Ok();
    }
}
