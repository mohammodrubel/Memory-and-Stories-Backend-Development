import z from "zod";

const bannerSchema = z.object({
    body: z.object({
        short_title: z
            .string()
            .min(2, "Short title must be at least 2 characters")
            .max(100),

        title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(200),

        description: z
            .string()
            .max(1000)
            .optional()
            .or(z.literal("")),

        image: z
            .string()
            .min(1, "Banner image is required"),

        project: z
            .number()
            .int("Project must be an integer")
            .min(0, "Project cannot be negative"),

        award: z
            .number()
            .int()
            .min(0, "Award cannot be negative"),

        experience: z
            .number()
            .int()
            .min(0, "Experience cannot be negative"),

        youtube: z
            .string()
            .url("Must be a valid URL")
            .optional()
            .or(z.literal("")),

        video: z
            .string()
            .url("Must be a valid URL")
            .optional()
            .or(z.literal("")),
    })
});


export default bannerSchema