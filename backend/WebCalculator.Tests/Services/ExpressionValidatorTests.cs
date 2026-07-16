using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebCalculator.Api.Services;

namespace WebCalculator.Tests.Services;

[TestClass]
public class ExpressionValidatorTests
{
    private readonly ExpressionValidator _v = new();

    [DataTestMethod]
    [DataRow("1+2")]
    [DataRow("1 + 2")]
    [DataRow("12*4")]
    [DataRow("100/4")]
    [DataRow("5-3")]
    [DataRow("1.5+2.5")]
    [DataRow("0.1+0.2")]
    [DataRow("(1+2)*3")]
    [DataRow("7*(8-3)")]
    [DataRow("(2+3)*4")]
    [DataRow("10/(2+3)")]
    [DataRow("(1+(2*3))-4")]
    [DataRow("  3 + 4  ")]
    public void Accepts_valid_expressions(string expr)
        => Assert.IsTrue(_v.Validate(expr).IsValid);

    [DataTestMethod]
    [DataRow("",     ValidationReason.Empty)]
    [DataRow("   ",  ValidationReason.Empty)]
    [DataRow("1+",   ValidationReason.TrailingOperator)]
    [DataRow("1.",   ValidationReason.TrailingOperator)]
    [DataRow("1++2", ValidationReason.DoubledOperator)]
    [DataRow("1..2", ValidationReason.DoubledDecimal)]
    [DataRow("5%3",  ValidationReason.BadCharacter)]
    [DataRow("5x3",  ValidationReason.BadCharacter)]
    [DataRow("abc",  ValidationReason.BadCharacter)]
    [DataRow("(1+2", ValidationReason.UnbalancedParens)]
    [DataRow("1+2)", ValidationReason.UnbalancedParens)]
    [DataRow("()",   ValidationReason.UnbalancedParens)]
    [DataRow("(1+)", ValidationReason.UnbalancedParens)]
    [DataRow("2(3+4)", ValidationReason.UnbalancedParens)]
    [DataRow("(2+3)4", ValidationReason.UnbalancedParens)]
    [DataRow("(2)(3)", ValidationReason.UnbalancedParens)]
    [DataRow("6/0",  ValidationReason.DivisionByZero)]
    public void Rejects_invalid_expressions(string expr, ValidationReason expected)
    {
        var result = _v.Validate(expr);
        Assert.IsFalse(result.IsValid);
        Assert.AreEqual(expected, result.Reason);
    }

    [TestMethod]
    public void Returns_division_by_zero_message()
    {
        var result = _v.Validate("6/0");

        StringAssert.StartsWith(result.Message, "Division by Zero:");
    }

    [DataTestMethod]
    [DataRow("(1+2")]
    [DataRow("5**2")]
    public void Returns_syntax_error_message_for_malformed_expression(string expr)
    {
        var result = _v.Validate(expr);

        StringAssert.StartsWith(result.Message, "Syntax Error:");
    }
}
