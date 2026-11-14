import { z } from 'zod';

const optionalString = z.string().max(500).optional().nullable().or(z.literal(''));

export const PhotographerCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().min(1).max(40),
    email: optionalString,
    notes: optionalString,
  }),
});

export const PhotographerUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().min(1).max(40).optional(),
    email: optionalString,
    notes: optionalString,
    archived: z.boolean().optional(),
  }),
});
