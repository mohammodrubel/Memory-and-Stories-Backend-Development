"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const typeEnum = zod_1.default.enum(['MOBILE_WALLET', 'BANK', 'OTHER']);
const createSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1),
        type: typeEnum,
        accountNumber: zod_1.default.string().min(1),
        accountHolder: zod_1.default.string().optional(),
        instructions: zod_1.default.string().optional(),
        active: zod_1.default.boolean().optional(),
        sortOrder: zod_1.default.number().int().optional(),
    }),
});
const updateSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
        type: typeEnum.optional(),
        accountNumber: zod_1.default.string().min(1).optional(),
        accountHolder: zod_1.default.string().optional(),
        instructions: zod_1.default.string().optional(),
        active: zod_1.default.boolean().optional(),
        sortOrder: zod_1.default.number().int().optional(),
    }),
});
exports.PaymentMethodValidation = { createSchema, updateSchema };
