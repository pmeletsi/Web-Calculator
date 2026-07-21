export const DIVISION_BY_ZERO_ERROR = 'Division by Zero: Δεν επιτρέπεται η διαίρεση με το μηδέν.';
export const SYNTAX_ERROR = 'Syntax Error: Η εξίσωση έχει λανθασμένη μορφή. Ελέγξτε τις παρενθέσεις και ότι δεν υπάρχουν δύο τελεστές στη σειρά (π.χ. 5 × × 2).';

export function getExpressionError(expr) {
  if (!expr || expr.trim() === '') return SYNTAX_ERROR;
  if (/\/\s*0(?![0-9.])/.test(expr)) return DIVISION_BY_ZERO_ERROR;
  if (/[+\-*/.(]$/.test(expr)) return SYNTAX_ERROR;
  if (/([+\-*/]{2,})/.test(expr.replace(/--/g, ''))) return SYNTAX_ERROR;
  if (/\.\./.test(expr)) return SYNTAX_ERROR;
  if (/[^0-9+\-*/().\s]/.test(expr)) return SYNTAX_ERROR;

  let depth = 0;
  for (const char of expr) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth < 0) return SYNTAX_ERROR;
  }

  if (depth !== 0) return SYNTAX_ERROR;

  return null;
}

export function isValidExpression(expr) {
  return getExpressionError(expr) === null;
}