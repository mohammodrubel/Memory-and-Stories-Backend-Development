import z from 'zod';

const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product is required'),
          quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
        }),
      )
      .min(1, 'Order must contain at least one item'),
    userId: z.string().optional(),
  }),
});

const updateOrderSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
  }),
});

export const OrderValidation = {
  createOrderSchema,
  updateOrderSchema,
};
