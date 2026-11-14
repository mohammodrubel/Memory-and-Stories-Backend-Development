import prisma from '../../utils/prisma';

const SINGLETON_ID = 'singleton';

export interface ISiteSettingsPayload {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  location?: string | null;
  heroProjects?: string | null;
  heroAwards?: string | null;
  heroYears?: string | null;
}

const get = async () => {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (existing) return existing;
  // Auto-create empty singleton on first read so admin UI has a row to edit.
  return prisma.siteSettings.create({ data: { id: SINGLETON_ID } });
};

const update = async (payload: ISiteSettingsPayload) => {
  return prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    update: payload,
    create: { id: SINGLETON_ID, ...payload },
  });
};

export const SiteSettingsService = { get, update };
