# Story 3.7: Extract validator to shared module + Vitest baseline

Status: ready-for-dev

## Story

As **a developer setting up the FE test foundation**,
I want **`isValidExpression` extracted to a shared module and exercised by the first Vitest tests**,
so that **the validator is reusable, regression-safe, and the project has a working `npm test` from this point forward (which Stories 7.3 and 8.1 build on)**.

## Acceptance Criteria

1. The validator from `src/pages/Calculator.jsx` (in its updated post-3.5 form) is moved verbatim to `src/lib/expressionValidator.js` and exported as a named export `isValidExpression`.
2. `src/pages/Calculator.jsx` imports it: `import { isValidExpression } from '../lib/expressionValidator';` — no other behavioural change.
3. The dev dependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` are installed.
4. `vite.config.js` has a `test` block configuring jsdom + globals + a setup file.
5. `vitest.setup.js` (or equivalent) imports `@testing-library/jest-dom`.
6. `package.json` has scripts: `"test": "vitest"`, `"test:run": "vitest run"`.
7. `src/lib/expressionValidator.test.js` covers **at least 5 valid + 5 invalid cases** and `npm run test:run` passes.
8. Calculator behaviour is **unchanged**: log in, calculate, history grows, `=` disabled when invalid — all exactly as before this PR.

## Tasks / Subtasks

- [ ] **Task 1 — Extract the validator module** (AC: 1, 2)
  - [ ] Create `src/lib/expressionValidator.js` with the function from **Dev Notes → Module content**.
  - [ ] In `src/pages/Calculator.jsx`, delete the inline `function isValidExpression(...)` and add the import line at the top.

- [ ] **Task 2 — Install Vitest + RTL stack** (AC: 3)
  - [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

- [ ] **Task 3 — Configure Vitest in `vite.config.js`** (AC: 4)
  - [ ] Apply the diff in **Dev Notes → `vite.config.js` change**.

- [ ] **Task 4 — Add the setup file** (AC: 5)
  - [ ] Create `vitest.setup.js` at the repo root with: `import '@testing-library/jest-dom';`

- [ ] **Task 5 — Add npm scripts** (AC: 6)
  - [ ] In `package.json`, add to `"scripts"`: `"test": "vitest"` and `"test:run": "vitest run"`.

- [ ] **Task 6 — Write the validator test file** (AC: 7)
  - [ ] Create `src/lib/expressionValidator.test.js` with the test cases in **Dev Notes → Test cases**.

- [ ] **Task 7 — Run and verify** (AC: 7, 8)
  - [ ] `npm run test:run` → all tests pass; coverage of the regex paths is good.
  - [ ] `npm run dev` → log in, type `1+2*3`, click `=` → result `7`. `=` disabled on `1+`. No regression.

- [ ] **Task 8 — Open the PR**
  - [ ] Branch: `feature/3.7-extract-validator-vitest`

## Dev Notes

### Why this story is XS-to-S

- The validator is already in its final shape after Story 3.5 (whitelist updated to ASCII operators, `%` and `x` dropped). All this story does is **move** it and add the test scaffolding.
- The test scaffolding is reused by Story 7.3 (full FE test suite) and consumed by Story 8.1 (CI workflow).

### Module content

`src/lib/expressionValidator.js`:

```javascript
// Validates an arithmetic expression made of digits, the four operators (+ - * /),
// decimal points, parentheses are NOT allowed at this point (no paren keys yet),
// and whitespace. Mirrors PRD FR5; the canonical server-side validator lives in
// WebCalculator.Domain.ExpressionValidator (Story 5.1).
export function isValidExpression(expr) {
  if (!expr || expr.trim() === '') return false;
  if (/[+\-*/.]$/.test(expr)) return false;                         // trailing operator/decimal
  if (/([+\-*/]{2,})/.test(expr.replace(/--/g, ''))) return false;  // doubled operators
  if (/\.\./.test(expr)) return false;                               // doubled decimals
  if (/[^0-9+\-*/.\s]/.test(expr)) return false;                    // whitelist enforcement
  if (/\/0(?![0-9.])/.test(expr)) return false;                     // division by zero
  return true;
}
```

### `vite.config.js` change

Update from the current config:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    css: false,
  },
});
```

If your `vite.config.js` is currently `defineConfig({ plugins: [react()] })`, add the `test` block exactly as above. The `globals: true` lets you use `describe / it / expect` without imports; the `jsdom` environment is required by RTL.

### Test cases

`src/lib/expressionValidator.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { isValidExpression } from './expressionValidator';

describe('isValidExpression — valid', () => {
  it.each([
    '1+2',
    '1 + 2',
    '12*4',
    '100/4',
    '5-3',
    '1.5+2.5',
    '0.1+0.2',
    '7*8-3',
    '99/3+1',
    '  3 + 4  ',
  ])('accepts %s', (expr) => {
    expect(isValidExpression(expr)).toBe(true);
  });
});

describe('isValidExpression — invalid', () => {
  it.each([
    ['empty',                ''],
    ['whitespace only',      '   '],
    ['trailing operator',    '1+'],
    ['trailing decimal',     '1.'],
    ['doubled operator',     '1++2'],
    ['doubled decimal',      '1..2'],
    ['percent (out of FR2)', '5%3'],
    ['x as operator',        '5x3'],
    ['letters',              'abc'],
    ['parentheses',          '(1+2)'],
    ['division by zero',     '6/0'],
  ])('rejects %s', (_label, expr) => {
    expect(isValidExpression(expr)).toBe(false);
  });
});
```

### Why `(1+2)` is rejected

Parens aren't yet supported in the FE — there are no `(` `)` keypad buttons (wireframe 2.3). The backend validator (Story 5.1) supports parens, but the FE cannot produce them, so rejecting them here is correct and intentional. If parens are ever added to the keypad in a future story, update both validators in lock-step.

### Why `division by zero` test uses `6/0`

The current regex `/\/0(?![0-9.])/` correctly rejects `/0` only when not followed by a digit/decimal (so `1/0` rejects but `1/0.5` does **not** reject — `/0.5` means dividing by 0.5, which is fine). The test verifies the no-following-digit case.

### What this story is NOT

- It is **not** a test for any UI component (that's Story 7.3).
- It does **not** add any production source code beyond the moved validator.
- It does **not** introduce CI (Story 8.1 wires CI to run `npm run test:run`).

### Out of scope

- Component tests (Story 7.3).
- Test coverage thresholds (could be a 7.4 / 8.1 concern).
- Snapshot tests (not used in this project).

### Project Structure Notes

- **NEW:** `src/lib/expressionValidator.js`
- **NEW:** `src/lib/expressionValidator.test.js`
- **NEW:** `vitest.setup.js` (repo root)
- **MODIFY:** `vite.config.js` (add `test` block)
- **MODIFY:** `src/pages/Calculator.jsx` (replace inline validator with import)
- **MODIFY:** `package.json` (devDependencies + scripts)

### References

- [Source: PRD §5 FR5, §6 NFR7](../planning-artifacts/prd.md)
- [Source: epics.md Story 3.7 + downstream Stories 5.1, 7.3, 8.1](../planning-artifacts/epics.md)
- Vitest docs: https://vitest.dev/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Vitest jsdom env: https://vitest.dev/config/#environment

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
