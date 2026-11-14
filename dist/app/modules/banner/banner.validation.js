"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const bannerSchema = zod_1.default.object({
    body: zod_1.default.object({
        short_title: zod_1.default
            .string()
            .min(2, "Short title must be at least 2 characters")
            .max(100),
        title: zod_1.default
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(200),
        description: zod_1.default
            .string()
            .max(1000)
            .optional()
            .or(zod_1.default.literal("")),
        image: zod_1.default
            .string()
            .min(1, "Banner image is required"),
        project: zod_1.default
            .number()
            .int("Project must be an integer")
            .min(0, "Project cannot be negative"),
        award: zod_1.default
            .number()
            .int()
            .min(0, "Award cannot be negative"),
        experience: zod_1.default
            .number()
            .int()
            .min(0, "Experience cannot be negative"),
        youtube: zod_1.default
            .string()
            .url("Must be a valid URL")
            .optional()
            .or(zod_1.default.literal("")),
        video: zod_1.default
            .string()
            .url("Must be a valid URL")
            .optional()
            .or(zod_1.default.literal("")),
    })
});
exports.default = bannerSchema;
