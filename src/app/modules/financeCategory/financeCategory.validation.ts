import { z } from 'zod';

export const CategoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60),
    type: z.enum(['EXPENSE', 'INCOME']),
    color: z.string().max(20).optional().nullable(),
  }),
});

export const CategoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60).optional(),
    color: z.string().max(20).optional().nullable(),
    archived: z.boolean().optional(),
  }),
});
