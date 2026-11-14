import z from 'zod';

const createSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1),
    date: z.string().min(1),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    notes: z.string().optional(),
    couponCode: z.string().optional(),
  }),
});

const submitScreenshotSchema = z.object({
  body: z.object({
    transactionRef: z.string().optional(),
    paymentMethodId: z.string().optional(),
  }),
});

const approveSchema = z.object({
  body: z.object({
    paidAmount: z.number().positive(),
    adminNote: z.string().optional(),
  }),
});

const rejectSchema = z.object({
  body: z.object({
    adminNote: z.string().min(1, 'Reason required'),
  }),
});

export const PaymentValidation = { createSchema, submitScreenshotSchema, approveSchema, rejectSchema };
