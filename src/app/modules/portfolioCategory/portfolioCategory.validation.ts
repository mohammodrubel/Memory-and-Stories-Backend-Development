import z from 'zod';

const name = z.string().trim().min(1, 'Category name is required').max(60, 'Category name is too long');

const createSchema = z.object({ body: z.object({ name }) });
const updateSchema = z.object({ body: z.object({ name }) });

export const PortfolioCategoryValidation = { createSchema, updateSchema };
