import z from 'zod';

const categoryIds = z.array(z.string().min(1)).min(1, 'Select at least one category');
const sortOrder = z.coerce.number().int().min(0).max(1_000_000);

const createPortfolioSchema = z.object({
  body: z.object({
    image: z.string().min(1, 'Image is required'),
    title: z.string().max(200).optional().or(z.literal('')),
    description: z.string().max(2000).optional().or(z.literal('')),
    categoryIds,
    sortOrder: sortOrder.optional(),
  }),
});

const updatePortfolioSchema = z.object({
  body: z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(2000).optional().or(z.literal('')),
    image: z.string().min(1).optional(),
    categoryIds: categoryIds.optional(),
    sortOrder: sortOrder.optional(),
  }),
});

export const PortfolioValidation = {
  createPortfolioSchema,
  updatePortfolioSchema,
};
