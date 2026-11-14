"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const LoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email format'),
        password: zod_1.z
            .string()
            .min(1, 'Password is required'),
    }),
});
const RegisterSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(3, 'Full name must be at least 3 characters')
            .max(255, 'Full name must be at most 255 characters'),
        email: zod_1.z
            .string()
            .min(1, 'Email is required')
            .email('Email must be a valid email'),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters'),
        phone: zod_1.z
            .string()
            .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
            .optional(),
        whatsapp: zod_1.z.boolean().optional(),
    }),
});
const ChangePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        old_password: zod_1.z
            .string()
            .min(1, 'Old password is required'),
        new_password: zod_1.z
            .string()
            .min(6, 'New password must be at least 6 characters'),
    }),
});
const AuthValidation = { LoginSchema, RegisterSchema, ChangePasswordSchema };
exports.default = AuthValidation;
