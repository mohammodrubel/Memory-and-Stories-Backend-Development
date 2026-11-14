import { DiscountKind, DiscountType, DiscountSource } from '@prisma/client';

export type { DiscountKind, DiscountType, DiscountSource };

export interface IDiscountCalcInput {
  subtotal: number;
  type: DiscountType;
  value: number;
  maxDiscountAmount?: number | null;
}

export interface IResolvedDiscount {
  source: DiscountSource;
  discountId?: string | null;
  type: DiscountType;
  value: number;
  amount: number;
  code?: string | null;
}
