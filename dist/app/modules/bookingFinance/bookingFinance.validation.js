"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseUpdateSchema = exports.ExpenseCreateSchema = exports.AssignmentUpdateSchema = exports.AssignmentCreateSchema = void 0;
const zod_1 = require("zod");
exports.AssignmentCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        photographerId: zod_1.z.string().min(1),
        fee: zod_1.z.number().nonnegative().default(0),
    }),
});
exports.AssignmentUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        photographerId: zod_1.z.string().min(1).optional(),
        fee: zod_1.z.number().nonnegative().optional(),
    }),
});
exports.ExpenseCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        label: zod_1.z.string().min(1).max(200),
        amount: zod_1.z.number().nonnegative(),
    }),
});
exports.ExpenseUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        label: zod_1.z.string().min(1).max(200).optional(),
        amount: zod_1.z.number().nonnegative().optional(),
    }),
});
