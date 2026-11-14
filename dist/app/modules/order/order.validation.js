"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createOrderSchema = zod_1.default.object({
    body: zod_1.default.object({
        items: zod_1.default
            .array(zod_1.default.object({
            productId: zod_1.default.string().min(1, 'Product is required'),
            quantity: zod_1.default.coerce.number().int().min(1, 'Quantity must be at least 1'),
        }))
            .min(1, 'Order must contain at least one item'),
        userId: zod_1.default.string().optional(),
    }),
});
const updateOrderSchema = zod_1.default.object({
    body: zod_1.default.object({
        status: zod_1.default.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
    }),
});
exports.OrderValidation = {
    createOrderSchema,
    updateOrderSchema,
};
