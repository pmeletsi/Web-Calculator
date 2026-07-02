// Validates an arithmetic expression made of digits, the four operators (+ - * /),
// decimal points, parentheses are NOT allowed at this point (no paren keys yet),
// and whitespace. Mirrors PRD FR5; the canonical server-side validator lives in
// WebCalculator.Api.Services.ExpressionValidator (Story 5.1).
export function isValidExpression(expr) {
  if (!expr || expr.trim() === '') return false;
  if (/[+\-*/.]$/.test(expr)) return false;                         // trailing operator/decimal
  if (/([+\-*/]{2,})/.test(expr.replace(/--/g, ''))) return false;  // doubled operators
  if (/\.\./.test(expr)) return false;                               // doubled decimals
  if (/[^0-9+\-*/.\s]/.test(expr)) return false;                    // whitelist enforcement
  if (/\/0(?![0-9.])/.test(expr)) return false;                     // division by zero
  return true;
}