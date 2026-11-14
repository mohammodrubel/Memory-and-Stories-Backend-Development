import { z } from 'zod';

const codeRegex = /^[A-Z0-9_-]{3,20}$/;

const baseDiscountFields = {
  name: z.string().min(1).max(120),
  kind: z.enum(['AUTO_SALE', 'COUPON']),
  type: z.enum(['FLAT', 'PERCENT']),
  value: z.number().positive(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  usageCap: z.number().int().positive().nullish(),
  perCustomerLimit: z.number().int().positive().nullish(),
  minBookingAmount: z.number().nonnegative().nullish(),
  maxDiscountAmount: z.number().positive().nullish(),
  active: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(), // empty / omitted = all services
  code: z
    .string()
    .transform((s) => s.toUpperCase())
    .refine((s) => codeRegex.test(s), 'code must match ^[A-Z0-9_-]{3,20}$')
    .nullish(),
};

const refineConsistency = (data: any, ctx: z.RefinementCtx) => {
  if (data.validFrom >= data.validTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['validTo'],
      message: 'validTo must be after validFrom',
    });
  }
  if (data.type === 'PERCENT' && data.value > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'PERCENT value must be <= 100' });
  }
  if (data.type === 'FLAT' && data.value > 1_000_000) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'FLAT value too large' });
  }
  if (data.kind === 'AUTO_SALE' && data.code) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'AUTO_SALE must not have code' });
  }
  if (data.kind === 'COUPON' && !data.code) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'COUPON requires code' });
  }
};

export const createDiscountSchema = z.object({ body: z.object(baseDiscountFields).superRefine(refineConsistency) });
export const updateDiscountSchema = z.object({
  body: z.object(baseDiscountFields).partial().superRefine((d, ctx) => {
    // Date consistency: only check if both present
    if (d.validFrom && d.validTo && d.validFrom >= d.validTo) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['validTo'], message: 'validTo must be after validFrom' });
    }
    // Type/value consistency: only check if both present
    if (d.type && d.value !== undefined) {
      if (d.type === 'PERCENT' && d.value > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'PERCENT value must be <= 100' });
      }
      if (d.type === 'FLAT' && d.value > 1_000_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'FLAT value too large' });
      }
    }
    // Kind/code consistency: check when kind is explicitly set in patch
    // - AUTO_SALE must not have a code (if code is in patch, it must be null/falsy)
    // - COUPON must have a code (if code is in patch, it must be non-empty; if not in patch, still required when kind is COUPON)
    if (d.kind === 'AUTO_SALE' && d.code) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'AUTO_SALE must not have code' });
    }
    if (d.kind === 'COUPON' && !d.code) {
      // Reject if code is missing, null, or empty
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'COUPON requires code' });
    }
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    serviceId: z.string().uuid(),
  }),
});

export const adHocDiscountSchema = z.object({
  body: z.object({
    type: z.enum(['FLAT', 'PERCENT']),
    value: z.number().positive(),
    reason: z.string().min(1).max(500),
  }).superRefine((d, ctx) => {
    if (d.type === 'PERCENT' && d.value > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'PERCENT value must be <= 100' });
    }
    if (d.type === 'FLAT' && d.value > 1_000_000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'FLAT value too large' });
    }
  }),
});

export const DiscountValidation = {
  createDiscountSchema,
  updateDiscountSchema,
  validateCouponSchema,
  adHocDiscountSchema,
};
