import z from 'zod';

const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .max(100, 'Category name is too long'),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .max(100, 'Category name is too long'),
  }),
});

export const CategoryValidation = {
  createCategorySchema,
  updateCategorySchema,
};
