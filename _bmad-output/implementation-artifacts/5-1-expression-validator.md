# Story 5.1: ExpressionValidator service (port + extend FE rules)

Status: ready-for-dev

## Story

As **the team**,
I want **a server-side `ExpressionValidator` that mirrors the FE rules from Story 3.7 and additionally accepts balanced parentheses**,
so that **Story 5.4 can reject malformed expressions before they reach the safe evaluator, and so the validation responsibility lives on the server (not just the client) — satisfying PRD FR5**.

## Acceptance Criteria

1. `backend/WebCalculator.Api/Services/ExpressionValidator.cs` exists with:
   - A public `enum ValidationReason { Valid, Empty, BadCharacter, UnbalancedParens, TrailingOperator, DoubledOperator, DoubledDecimal, DivisionByZero }`.
   - A public `record ValidationResult(bool IsValid, ValidationReason Reason, string? Message)` with `Ok()` and `Fail(...)` static helpers.
   - A public class `ExpressionValidator` with `ValidationResult Validate(string expression)`.
2. The validator rejects: empty / whitespace-only, unsupported characters, mismatched parentheses, leading/trailing operator (after trim), doubled operators (allowing `--`), doubled decimals, and division-by-zero patterns (`/0` not followed by digit/decimal).
3. The validator's whitelist: digits, `.`, whitespace, `+ - * / ( )`. **No `%`, no `x`, no letters.**
4. Registered as a singleton in `Program.cs`: `builder.Services.AddSingleton<ExpressionValidator>();`.
5. xUnit test class `WebCalculator.Tests/Services/ExpressionValidatorTests.cs` exercises **at least 10 valid + 10 invalid** cases. `dotnet test` passes.

## Tasks / Subtasks

- [ ] **Task 1 — Create the validator** (AC: 1, 2, 3)
  - [ ] `backend/WebCalculator.Api/Services/ExpressionValidator.cs` per **Dev Notes → Validator content**.

- [ ] **Task 2 — Register as singleton** (AC: 4)
  - [ ] In `Program.cs`, after the DbContext registration:
    ```csharp
    builder.Services.AddSingleton<ExpressionValidator>();
    ```
  - [ ] Add `using WebCalculator.Api.Services;` at the top.

- [ ] **Task 3 — Write the test class** (AC: 5)
  - [ ] `backend/WebCalculator.Tests/Services/ExpressionValidatorTests.cs` per **Dev Notes → Test content**.

- [ ] **Task 4 — Verify**
  - [ ] `dotnet build backend/WebCalculator.sln` → 0 warnings.
  - [ ] `dotnet test backend/WebCalculator.sln` → all tests green.

- [ ] **Task 5 — Open the PR**
  - [ ] Branch: `feature/5.1-expression-validator`

## Dev Notes

### Validator content

`backend/WebCalculator.Api/Services/ExpressionValidator.cs`:

```csharp
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
```

### Test content

`backend/WebCalculator.Tests/Services/ExpressionValidatorTests.cs`:

```csharp
using WebCalculator.Api.Services;
using Xunit;

namespace WebCalculator.Tests.Services;

public class ExpressionValidatorTests
{
    private readonly ExpressionValidator _v = new();

    [Theory]
    [InlineData("1+2")]
    [InlineData("1 + 2")]
    [InlineData("12*4")]
    [InlineData("100/4")]
    [InlineData("5-3")]
    [InlineData("1.5+2.5")]
    [InlineData("0.1+0.2")]
    [InlineData("(1+2)*3")]
    [InlineData("7*(8-3)")]
    [InlineData("  3 + 4  ")]
    public void Accepts_valid_expressions(string expr)
        => Assert.True(_v.Validate(expr).IsValid);

    [Theory]
    [InlineData("",            ValidationReason.Empty)]
    [InlineData("   ",         ValidationReason.Empty)]
    [InlineData("1+",          ValidationReason.TrailingOperator)]
    [InlineData("1.",          ValidationReason.TrailingOperator)]
    [InlineData("1++2",        ValidationReason.DoubledOperator)]
    [InlineData("1..2",        ValidationReason.DoubledDecimal)]
    [InlineData("5%3",         ValidationReason.BadCharacter)]
    [InlineData("5x3",         ValidationReason.BadCharacter)]
    [InlineData("abc",         ValidationReason.BadCharacter)]
    [InlineData("(1+2",        ValidationReason.UnbalancedParens)]
    [InlineData("1+2)",        ValidationReason.UnbalancedParens)]
    [InlineData("6/0",         ValidationReason.DivisionByZero)]
    public void Rejects_invalid_expressions(string expr, ValidationReason expected)
    {
        var result = _v.Validate(expr);
        Assert.False(result.IsValid);
        Assert.Equal(expected, result.Reason);
    }
}
```

### Differences from the FE validator (Story 3.7)

| Aspect | FE (3.7) | BE (this story) |
|---|---|---|
| Parentheses | **Rejected** (no `(`/`)` keys on the keypad) | **Accepted** (balanced) |
| Whitelist | `0-9 + - * / .` whitespace | adds `( )` |
| Reason codes | none — boolean `true/false` | `enum ValidationReason` for structured 400 responses |
| Where errors render | client-side disabled `=` button | 400 response body `{ reason, message }` |

The two validators are intentionally **not identical**. The BE is strictly more permissive because clients other than our FE may legitimately send parens, and the FE's stricter rule reflects what the keypad can produce (defence in depth).

### Why singleton

`ExpressionValidator` has no mutable state (the regexes are static). Singleton avoids per-request allocation. Junior-friendly: registering with `AddSingleton` says "this is shared and stateless."

### Out of scope

- The HTTP endpoint that uses this — Story 5.4.
- Evaluation (NCalc / shunting-yard) — Story 5.4.
- Authentication — Stories 5.2 / 5.3.
- Extended test coverage — Story 7.1 expands.

### Project Structure Notes

- **NEW:** `backend/WebCalculator.Api/Services/ExpressionValidator.cs`
- **NEW:** `backend/WebCalculator.Tests/Services/ExpressionValidatorTests.cs`
- **MODIFY:** `backend/WebCalculator.Api/Program.cs` (1 line + using)

### References

- [Source: PRD §5 FR5, §6 NFR7, §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 5.1](../planning-artifacts/epics.md)
- [Source: FE validator — Story 3.7](./3-7-extract-validator-vitest.md)
- xUnit Theory + InlineData: https://xunit.net/docs/getting-started/v3/theory

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
