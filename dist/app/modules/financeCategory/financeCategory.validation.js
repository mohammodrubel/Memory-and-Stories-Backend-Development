"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryUpdateSchema = exports.CategoryCreateSchema = void 0;
const zod_1 = require("zod");
exports.CategoryCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(60),
        type: zod_1.z.enum(['EXPENSE', 'INCOME']),
        color: zod_1.z.string().max(20).optional().nullable(),
    }),
});
exports.CategoryUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(60).optional(),
        color: zod_1.z.string().max(20).optional().nullable(),
        archived: zod_1.z.boolean().optional(),
    }),
});
