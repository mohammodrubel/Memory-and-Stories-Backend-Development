"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountValidation = exports.adHocDiscountSchema = exports.validateCouponSchema = exports.updateDiscountSchema = exports.createDiscountSchema = void 0;
const zod_1 = require("zod");
const codeRegex = /^[A-Z0-9_-]{3,20}$/;
const baseDiscountFields = {
    name: zod_1.z.string().min(1).max(120),
    kind: zod_1.z.enum(['AUTO_SALE', 'COUPON']),
    type: zod_1.z.enum(['FLAT', 'PERCENT']),
    value: zod_1.z.number().positive(),
    validFrom: zod_1.z.coerce.date(),
    validTo: zod_1.z.coerce.date(),
    usageCap: zod_1.z.number().int().positive().nullish(),
    perCustomerLimit: zod_1.z.number().int().positive().nullish(),
    minBookingAmount: zod_1.z.number().nonnegative().nullish(),
    maxDiscountAmount: zod_1.z.number().positive().nullish(),
    active: zod_1.z.boolean().optional(),
    serviceIds: zod_1.z.array(zod_1.z.string().uuid()).optional(), // empty / omitted = all services
    code: zod_1.z
        .string()
        .transform((s) => s.toUpperCase())
        .refine((s) => codeRegex.test(s), 'code must match ^[A-Z0-9_-]{3,20}$')
        .nullish(),
};
const refineConsistency = (data, ctx) => {
    if (data.validFrom >= data.validTo) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['validTo'],
            message: 'validTo must be after validFrom',
        });
    }
    if (data.type === 'PERCENT' && data.value > 100) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['value'], message: 'PERCENT value must be <= 100' });
    }
    if (data.type === 'FLAT' && data.value > 1000000) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['value'], message: 'FLAT value too large' });
    }
    if (data.kind === 'AUTO_SALE' && data.code) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['code'], message: 'AUTO_SALE must not have code' });
    }
    if (data.kind === 'COUPON' && !data.code) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['code'], message: 'COUPON requires code' });
    }
};
exports.createDiscountSchema = zod_1.z.object({ body: zod_1.z.object(baseDiscountFields).superRefine(refineConsistency) });
exports.updateDiscountSchema = zod_1.z.object({
    body: zod_1.z.object(baseDiscountFields).partial().superRefine((d, ctx) => {
        // Date consistency: only check if both present
        if (d.validFrom && d.validTo && d.validFrom >= d.validTo) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['validTo'], message: 'validTo must be after validFrom' });
        }
        // Type/value consistency: only check if both present
        if (d.type && d.value !== undefined) {
            if (d.type === 'PERCENT' && d.value > 100) {
                ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['value'], message: 'PERCENT value must be <= 100' });
            }
            if (d.type === 'FLAT' && d.value > 1000000) {
                ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['value'], message: 'FLAT value too large' });
            }
        }
        // Kind/code consistency: check when kind is explicitly set in patch
        // - AUTO_SALE must not have a code (if code is in patch, it must be null/falsy)
        // - COUPON must have a code (if code is in patch, it must be non-empty; if not in patch, still required when kind is COUPON)
        if (d.kind === 'AUTO_SALE' && d.code) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['code'], message: 'AUTO_SALE must not have code' });
        }
        if (d.kind === 'COUPON' && !d.code) {
            // Reject if code is missing, null, or empty
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['code'], message: 'COUPON requires code' });
        }
    }),
});
exports.validateCouponSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1),
        serviceId: zod_1.z.string().uuid(),
    }),
});
exports.adHocDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['FLAT', 'PERCENT']),
        value: zod_1.z.number().positive(),
        reason: zod_1.z.string().min(1).max(500),
    }).superRefine((d, ctx) => {
        if (d.type === 'PERCENT' && d.value > 100) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['value'], message: 'PERCENT value must be <= 100' });
        }
        if (d.type === 'FLAT' && d.value > 1000000) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['value'], message: 'FLAT value too large' });
        }
    }),
});
exports.DiscountValidation = {
    createDiscountSchema: exports.createDiscountSchema,
    updateDiscountSchema: exports.updateDiscountSchema,
    validateCouponSchema: exports.validateCouponSchema,
    adHocDiscountSchema: exports.adHocDiscountSchema,
};
