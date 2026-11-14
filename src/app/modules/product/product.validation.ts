import z from 'zod';

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    image: z.string().min(1, 'Image is required'),
    description: z.string().max(2000).optional().or(z.literal('')),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    price: z.coerce.number().min(0).optional(),
    image: z.string().min(1).optional(),
    description: z.string().max(2000).optional().or(z.literal('')),
    archived: z.boolean().optional(),
  }),
});

export const ProductValidation = {
  createProductSchema,
  updateProductSchema,
};
