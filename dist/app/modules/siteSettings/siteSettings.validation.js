"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const nullableString = zod_1.z
    .string()
    .max(255)
    .nullable()
    .optional()
    .or(zod_1.z.literal(''));
const SiteSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: nullableString,
        phone: nullableString,
        whatsapp: nullableString,
        instagram: nullableString,
        facebook: nullableString,
        location: nullableString,
        heroProjects: nullableString,
        heroAwards: nullableString,
        heroYears: nullableString,
    }),
});
exports.default = SiteSettingsSchema;
