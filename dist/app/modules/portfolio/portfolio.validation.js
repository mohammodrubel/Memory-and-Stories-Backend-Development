"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const categoryIds = zod_1.default.array(zod_1.default.string().min(1)).min(1, 'Select at least one category');
const sortOrder = zod_1.default.coerce.number().int().min(0).max(1000000);
const createPortfolioSchema = zod_1.default.object({
    body: zod_1.default.object({
        image: zod_1.default.string().min(1, 'Image is required'),
        title: zod_1.default.string().max(200).optional().or(zod_1.default.literal('')),
        description: zod_1.default.string().max(2000).optional().or(zod_1.default.literal('')),
        categoryIds,
        sortOrder: sortOrder.optional(),
    }),
});
const updatePortfolioSchema = zod_1.default.object({
    body: zod_1.default.object({
        title: zod_1.default.string().max(200).optional(),
        description: zod_1.default.string().max(2000).optional().or(zod_1.default.literal('')),
        image: zod_1.default.string().min(1).optional(),
        categoryIds: categoryIds.optional(),
        sortOrder: sortOrder.optional(),
    }),
});
exports.PortfolioValidation = {
    createPortfolioSchema,
    updatePortfolioSchema,
};
