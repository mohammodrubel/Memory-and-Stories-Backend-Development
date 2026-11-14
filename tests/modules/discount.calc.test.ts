import { describe, it, expect } from 'vitest';
import { computeDiscountAmount, chooseBestDiscount, round2 } from '../../src/app/modules/discount/discount.calc';

describe('round2', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.499)).toBe(2.5);
  });
});

describe('computeDiscountAmount', () => {
  it('FLAT amount returned as-is, rounded', () => {
    expect(computeDiscountAmount({ subtotal: 1000, type: 'FLAT', value: 200.125 })).toBe(200.13);
  });

  it('FLAT clamps to subtotal (never negative total)', () => {
    expect(computeDiscountAmount({ subtotal: 500, type: 'FLAT', value: 1000 })).toBe(500);
  });

  it('PERCENT applies percent of subtotal', () => {
    expect(computeDiscountAmount({ subtotal: 1000, type: 'PERCENT', value: 15 })).toBe(150);
  });

  it('PERCENT respects maxDiscountAmount cap', () => {
    expect(
      computeDiscountAmount({ subtotal: 100000, type: 'PERCENT', value: 10, maxDiscountAmount: 2000 }),
    ).toBe(2000);
  });

  it('PERCENT without cap not capped', () => {
    expect(computeDiscountAmount({ subtotal: 100000, type: 'PERCENT', value: 10 })).toBe(10000);
  });

  it('zero value returns 0', () => {
    expect(computeDiscountAmount({ subtotal: 1000, type: 'FLAT', value: 0 })).toBe(0);
  });
});

describe('chooseBestDiscount', () => {
  it('returns null when both null', () => {
    expect(chooseBestDiscount(null, null)).toBeNull();
  });
  it('returns non-null over null', () => {
    const a = { amount: 100 };
    expect(chooseBestDiscount(a, null)).toBe(a);
    expect(chooseBestDiscount(null, a)).toBe(a);
  });
  it('returns the larger amount', () => {
    const a = { amount: 100 };
    const b = { amount: 250 };
    expect(chooseBestDiscount(a, b)).toBe(b);
    expect(chooseBestDiscount(b, a)).toBe(b);
  });
  it('tie returns first arg', () => {
    const a = { amount: 100, code: 'A' };
    const b = { amount: 100, code: 'B' };
    expect(chooseBestDiscount(a, b)).toBe(a);
  });
});
