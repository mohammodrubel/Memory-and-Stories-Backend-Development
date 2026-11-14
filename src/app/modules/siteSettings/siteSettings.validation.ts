import { z } from 'zod';

const nullableString = z
  .string()
  .max(255)
  .nullable()
  .optional()
  .or(z.literal(''));

const SiteSettingsSchema = z.object({
  body: z.object({
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

export default SiteSettingsSchema;
