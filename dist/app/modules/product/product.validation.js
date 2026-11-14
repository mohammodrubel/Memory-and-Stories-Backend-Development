"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createProductSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, 'Name is required').max(200),
        price: zod_1.default.coerce.number().min(0, 'Price cannot be negative'),
        image: zod_1.default.string().min(1, 'Image is required'),
        description: zod_1.default.string().max(2000).optional().or(zod_1.default.literal('')),
    }),
});
const updateProductSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).max(200).optional(),
        price: zod_1.default.coerce.number().min(0).optional(),
        image: zod_1.default.string().min(1).optional(),
        description: zod_1.default.string().max(2000).optional().or(zod_1.default.literal('')),
        archived: zod_1.default.boolean().optional(),
    }),
});
exports.ProductValidation = {
    createProductSchema,
    updateProductSchema,
};
