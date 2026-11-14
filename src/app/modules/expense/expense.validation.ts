import { z } from 'zod';

export const ExpenseCreateSchema = z.object({
  body: z.object({
    date: z.string().min(1),
    categoryId: z.string().min(1),
    amount: z.number().nonnegative(),
    note: z.string().max(500).optional().nullable(),
    staffId: z.string().optional().nullable(),
    recurringExpenseId: z.string().optional().nullable(),
  }),
});

export const ExpenseUpdateSchema = z.object({
  body: z.object({
    date: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    note: z.string().max(500).optional().nullable(),
    staffId: z.string().optional().nullable(),
  }),
});

export const IncomeCreateSchema = z.object({
  body: z.object({
    date: z.string().min(1),
    categoryId: z.string().min(1),
    amount: z.number().nonnegative(),
    note: z.string().max(500).optional().nullable(),
    bookingId: z.string().optional().nullable(),
  }),
});

export const IncomeUpdateSchema = z.object({
  body: z.object({
    date: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    note: z.string().max(500).optional().nullable(),
  }),
});

export const ConfirmDraftsSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    items: z.array(
      z.object({
        recurringExpenseId: z.string().min(1),
        amount: z.number().nonnegative(),
        date: z.string().min(1),
        note: z.string().max(500).optional().nullable(),
      }),
    ),
  }),
});
