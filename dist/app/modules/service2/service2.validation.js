"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const serviceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string()
            .min(1, { message: "Title is required" }),
        description: zod_1.z
            .string()
            .min(1, { message: "Description is required" }),
    }),
});
exports.default = serviceSchema;
