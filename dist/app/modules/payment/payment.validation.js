"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createSchema = zod_1.default.object({
    body: zod_1.default.object({
        serviceId: zod_1.default.string().min(1),
        date: zod_1.default.string().min(1),
        customerName: zod_1.default.string().optional(),
        customerEmail: zod_1.default.string().email().optional(),
        customerPhone: zod_1.default.string().optional(),
        notes: zod_1.default.string().optional(),
        couponCode: zod_1.default.string().optional(),
    }),
});
const submitScreenshotSchema = zod_1.default.object({
    body: zod_1.default.object({
        transactionRef: zod_1.default.string().optional(),
        paymentMethodId: zod_1.default.string().optional(),
    }),
});
const approveSchema = zod_1.default.object({
    body: zod_1.default.object({
        paidAmount: zod_1.default.number().positive(),
        adminNote: zod_1.default.string().optional(),
    }),
});
const rejectSchema = zod_1.default.object({
    body: zod_1.default.object({
        adminNote: zod_1.default.string().min(1, 'Reason required'),
    }),
});
exports.PaymentValidation = { createSchema, submitScreenshotSchema, approveSchema, rejectSchema };
