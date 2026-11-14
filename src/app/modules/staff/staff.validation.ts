import { z } from 'zod';

const optionalString = z.string().max(500).optional().nullable().or(z.literal(''));

export const StaffCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    role: z.string().min(1).max(60),
    monthlySalary: z.number().nonnegative().default(0),
    phone: optionalString,
    status: z.enum(['active', 'inactive']).default('active'),
    notes: optionalString,
  }),
});

export const StaffUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    role: z.string().min(1).max(60).optional(),
    monthlySalary: z.number().nonnegative().optional(),
    phone: optionalString,
    status: z.enum(['active', 'inactive']).optional(),
    notes: optionalString,
  }),
});
