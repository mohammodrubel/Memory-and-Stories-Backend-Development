import { z } from 'zod';

export const RecurringCreateSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(120),
    categoryId: z.string().min(1),
    defaultAmount: z.number().nonnegative().default(0),
    staffId: z.string().optional().nullable(),
    active: z.boolean().default(true),
  }),
});

export const RecurringUpdateSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(120).optional(),
    categoryId: z.string().min(1).optional(),
    defaultAmount: z.number().nonnegative().optional(),
    staffId: z.string().optional().nullable(),
    active: z.boolean().optional(),
  }),
});
