import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const list = async (includeArchived = false) => {
  return prisma.photographer.findMany({
    where: includeArchived ? {} : { archived: false },
    orderBy: { name: 'asc' },
  });
};

const getById = async (id: string) => {
  const found = await prisma.photographer.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Photographer not found');
  return found;
};

const create = async (data: { name: string; phone: string; email?: string | null; notes?: string | null }) => {
  return prisma.photographer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      notes: data.notes || null,
    },
  });
};

const update = async (id: string, data: Record<string, unknown>) => {
  await getById(id);
  return prisma.photographer.update({ where: { id }, data });
};

const remove = async (id: string) => {
  await getById(id);
  const assignmentCount = await prisma.bookingAssignment.count({ where: { photographerId: id } });
  if (assignmentCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Photographer has assignments; archive instead of delete',
    );
  }
  await prisma.photographer.delete({ where: { id } });
  return { id };
};

export const PhotographerService = { list, getById, create, update, remove };
