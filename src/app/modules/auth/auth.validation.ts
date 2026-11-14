import { z } from 'zod';

const LoginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

const RegisterSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Full name must be at least 3 characters')
      .max(255, 'Full name must be at most 255 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Email must be a valid email'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
      .optional(),
    whatsapp: z.boolean().optional(),
  }),
});

const ChangePasswordSchema = z.object({
  body: z.object({
    old_password: z
      .string()
      .min(1, 'Old password is required'),
    new_password: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
  }),
});

const AuthValidation = { LoginSchema, RegisterSchema, ChangePasswordSchema };

export default AuthValidation;