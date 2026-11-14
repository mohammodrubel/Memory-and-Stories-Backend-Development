"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createInquirySchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().trim().min(2, 'Name is required').max(100),
        email: zod_1.default.string().trim().email('Valid email required').max(200),
        phone: zod_1.default.string().trim().min(6, 'Phone is required').max(30).regex(/^[0-9+()\-\s]+$/, 'Invalid phone number'),
        service: zod_1.default.string().trim().max(120).optional().or(zod_1.default.literal('')),
        eventDate: zod_1.default.string().optional().or(zod_1.default.literal('')),
        message: zod_1.default.string().trim().min(10, 'Message is too short').max(3000),
        // Honeypot: real users leave this empty.
        website: zod_1.default.string().max(0).optional(),
    }),
});
const updateStatusSchema = zod_1.default.object({
    body: zod_1.default.object({ status: zod_1.default.enum(['NEW', 'READ', 'REPLIED']) }),
});
exports.InquiryValidation = { createInquirySchema, updateStatusSchema };
