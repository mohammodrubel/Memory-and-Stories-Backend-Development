"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmDraftsSchema = exports.IncomeUpdateSchema = exports.IncomeCreateSchema = exports.ExpenseUpdateSchema = exports.ExpenseCreateSchema = void 0;
const zod_1 = require("zod");
exports.ExpenseCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().min(1),
        categoryId: zod_1.z.string().min(1),
        amount: zod_1.z.number().nonnegative(),
        note: zod_1.z.string().max(500).optional().nullable(),
        staffId: zod_1.z.string().optional().nullable(),
        recurringExpenseId: zod_1.z.string().optional().nullable(),
    }),
});
exports.ExpenseUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().min(1).optional(),
        categoryId: zod_1.z.string().min(1).optional(),
        amount: zod_1.z.number().nonnegative().optional(),
        note: zod_1.z.string().max(500).optional().nullable(),
        staffId: zod_1.z.string().optional().nullable(),
    }),
});
exports.IncomeCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().min(1),
        categoryId: zod_1.z.string().min(1),
        amount: zod_1.z.number().nonnegative(),
        note: zod_1.z.string().max(500).optional().nullable(),
        bookingId: zod_1.z.string().optional().nullable(),
    }),
});
exports.IncomeUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().min(1).optional(),
        categoryId: zod_1.z.string().min(1).optional(),
        amount: zod_1.z.number().nonnegative().optional(),
        note: zod_1.z.string().max(500).optional().nullable(),
    }),
});
exports.ConfirmDraftsSchema = zod_1.z.object({
    body: zod_1.z.object({
        month: zod_1.z.string().regex(/^\d{4}-\d{2}$/),
        items: zod_1.z.array(zod_1.z.object({
            recurringExpenseId: zod_1.z.string().min(1),
            amount: zod_1.z.number().nonnegative(),
            date: zod_1.z.string().min(1),
            note: zod_1.z.string().max(500).optional().nullable(),
        })),
    }),
});
