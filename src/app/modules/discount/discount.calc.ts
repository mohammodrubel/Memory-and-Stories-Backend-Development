import type { IDiscountCalcInput } from './discount.types';

export const round2 = (n: number): number => {
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

export const computeDiscountAmount = (input: IDiscountCalcInput): number => {
  const { subtotal, type, value, maxDiscountAmount } = input;
  if (value <= 0 || subtotal <= 0) return 0;
  let raw: number;
  if (type === 'FLAT') {
    raw = value;
  } else {
    raw = (subtotal * value) / 100;
    if (maxDiscountAmount != null && maxDiscountAmount > 0) {
      raw = Math.min(raw, maxDiscountAmount);
    }
  }
  raw = Math.min(raw, subtotal);
  return round2(raw);
};

export const chooseBestDiscount = <T extends { amount: number }>(
  a: T | null,
  b: T | null,
): T | null => {
  if (!a) return b;
  if (!b) return a;
  return a.amount >= b.amount ? a : b;
};
