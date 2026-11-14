import z from 'zod';

const createInquirySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is required').max(100),
    email: z.string().trim().email('Valid email required').max(200),
    phone: z.string().trim().min(6, 'Phone is required').max(30).regex(/^[0-9+()\-\s]+$/, 'Invalid phone number'),
    service: z.string().trim().max(120).optional().or(z.literal('')),
    eventDate: z.string().optional().or(z.literal('')),
    message: z.string().trim().min(10, 'Message is too short').max(3000),
    // Honeypot: real users leave this empty.
    website: z.string().max(0).optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({ status: z.enum(['NEW', 'READ', 'REPLIED']) }),
});

export const InquiryValidation = { createInquirySchema, updateStatusSchema };
