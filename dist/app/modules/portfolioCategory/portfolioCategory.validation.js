"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioCategoryValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const name = zod_1.default.string().trim().min(1, 'Category name is required').max(60, 'Category name is too long');
const createSchema = zod_1.default.object({ body: zod_1.default.object({ name }) });
const updateSchema = zod_1.default.object({ body: zod_1.default.object({ name }) });
exports.PortfolioCategoryValidation = { createSchema, updateSchema };
