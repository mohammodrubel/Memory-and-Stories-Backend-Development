"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffUpdateSchema = exports.StaffCreateSchema = void 0;
const zod_1 = require("zod");
const optionalString = zod_1.z.string().max(500).optional().nullable().or(zod_1.z.literal(''));
exports.StaffCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(120),
        role: zod_1.z.string().min(1).max(60),
        monthlySalary: zod_1.z.number().nonnegative().default(0),
        phone: optionalString,
        status: zod_1.z.enum(['active', 'inactive']).default('active'),
        notes: optionalString,
    }),
});
exports.StaffUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(120).optional(),
        role: zod_1.z.string().min(1).max(60).optional(),
        monthlySalary: zod_1.z.number().nonnegative().optional(),
        phone: optionalString,
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        notes: optionalString,
    }),
});
