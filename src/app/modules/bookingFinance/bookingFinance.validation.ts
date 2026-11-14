import { z } from 'zod';

export const AssignmentCreateSchema = z.object({
  body: z.object({
    photographerId: z.string().min(1),
    fee: z.number().nonnegative().default(0),
  }),
});

export const AssignmentUpdateSchema = z.object({
  body: z.object({
    photographerId: z.string().min(1).optional(),
    fee: z.number().nonnegative().optional(),
  }),
});

export const ExpenseCreateSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(200),
    amount: z.number().nonnegative(),
  }),
});

export const ExpenseUpdateSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(200).optional(),
    amount: z.number().nonnegative().optional(),
  }),
});
