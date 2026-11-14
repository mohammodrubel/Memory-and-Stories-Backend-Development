"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringUpdateSchema = exports.RecurringCreateSchema = void 0;
const zod_1 = require("zod");
exports.RecurringCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        label: zod_1.z.string().min(1).max(120),
        categoryId: zod_1.z.string().min(1),
        defaultAmount: zod_1.z.number().nonnegative().default(0),
        staffId: zod_1.z.string().optional().nullable(),
        active: zod_1.z.boolean().default(true),
    }),
});
exports.RecurringUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        label: zod_1.z.string().min(1).max(120).optional(),
        categoryId: zod_1.z.string().min(1).optional(),
        defaultAmount: zod_1.z.number().nonnegative().optional(),
        staffId: zod_1.z.string().optional().nullable(),
        active: zod_1.z.boolean().optional(),
    }),
});
