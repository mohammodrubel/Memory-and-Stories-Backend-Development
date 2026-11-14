import z from 'zod';

const typeEnum = z.enum(['MOBILE_WALLET', 'BANK', 'OTHER']);

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: typeEnum,
    accountNumber: z.string().min(1),
    accountHolder: z.string().optional(),
    instructions: z.string().optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: typeEnum.optional(),
    accountNumber: z.string().min(1).optional(),
    accountHolder: z.string().optional(),
    instructions: z.string().optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const PaymentMethodValidation = { createSchema, updateSchema };
