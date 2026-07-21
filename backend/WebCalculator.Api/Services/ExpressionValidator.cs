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
    private const string DivisionByZeroError = "Division by Zero: Δεν επιτρέπεται η διαίρεση με το μηδέν.";
    private const string SyntaxError = "Syntax Error: Η εξίσωση έχει λανθασμένη μορφή.";

    // Whitelist: digits, decimal point, whitespace, + - * / ( )
    private static readonly Regex Whitelist        = new(@"^[\d+\-*/().\s]+$",      RegexOptions.Compiled);
    private static readonly Regex TrailingOperator = new(@"[+\-*/.]\s*$",           RegexOptions.Compiled);
    private static readonly Regex DoubledOperator  = new(@"[+\-*/]{2,}",            RegexOptions.Compiled);
    private static readonly Regex DivisionByZero   = new(@"/\s*0(?![\d.])",         RegexOptions.Compiled);
    private static readonly Regex EmptyParens      = new(@"\(\s*\)",               RegexOptions.Compiled);
    private static readonly Regex OperatorBeforeCloseParen = new(@"[+\-*/.]\s*\)", RegexOptions.Compiled);
    private static readonly Regex ImplicitMultiplication = new(@"\d\s*\(|\)\s*\d|\)\s*\(", RegexOptions.Compiled);

    public ValidationResult Validate(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
            return ValidationResult.Fail(ValidationReason.Empty, SyntaxError);

        if (!Whitelist.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.BadCharacter, SyntaxError);

        if (TrailingOperator.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.TrailingOperator, SyntaxError);

        // Allow `--` (negation pattern); reject other doubled operators.
        if (DoubledOperator.IsMatch(expression.Replace("--", "")))
            return ValidationResult.Fail(ValidationReason.DoubledOperator, SyntaxError);

        if (expression.Contains(".."))
            return ValidationResult.Fail(ValidationReason.DoubledDecimal, SyntaxError);

        if (EmptyParens.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.UnbalancedParens, SyntaxError);

        if (OperatorBeforeCloseParen.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.UnbalancedParens, SyntaxError);

        if (ImplicitMultiplication.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.UnbalancedParens, SyntaxError);

        // Balanced parentheses
        var depth = 0;
        foreach (var c in expression)
        {
            if (c == '(') depth++;
            else if (c == ')') depth--;
            if (depth < 0)
                return ValidationResult.Fail(ValidationReason.UnbalancedParens, SyntaxError);
        }
        if (depth != 0)
            return ValidationResult.Fail(ValidationReason.UnbalancedParens, SyntaxError);

        if (DivisionByZero.IsMatch(expression))
            return ValidationResult.Fail(ValidationReason.DivisionByZero, DivisionByZeroError);

        return ValidationResult.Ok();
    }
}
