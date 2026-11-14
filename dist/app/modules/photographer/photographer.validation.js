"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotographerUpdateSchema = exports.PhotographerCreateSchema = void 0;
const zod_1 = require("zod");
const optionalString = zod_1.z.string().max(500).optional().nullable().or(zod_1.z.literal(''));
exports.PhotographerCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(120),
        phone: zod_1.z.string().min(1).max(40),
        email: optionalString,
        notes: optionalString,
    }),
});
exports.PhotographerUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(120).optional(),
        phone: zod_1.z.string().min(1).max(40).optional(),
        email: optionalString,
        notes: optionalString,
        archived: zod_1.z.boolean().optional(),
    }),
});
