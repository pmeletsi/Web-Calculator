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