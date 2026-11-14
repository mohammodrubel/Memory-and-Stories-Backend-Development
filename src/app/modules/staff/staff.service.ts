import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const list = async (includeInactive = false) => {
  return prisma.staff.findMany({
    where: includeInactive ? {} : { status: 'active' },
    orderBy: { name: 'asc' },
  });
};

const getById = async (id: string) => {
  const found = await prisma.staff.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  return found;
};

const create = async (data: Record<string, unknown>) => {
  return prisma.staff.create({ data: data as never });
};

const update = async (id: string, data: Record<string, unknown>) => {
  await getById(id);
  return prisma.staff.update({ where: { id }, data });
};

const remove = async (id: string) => {
  await getById(id);
  const expenseCount = await prisma.expense.count({ where: { staffId: id } });
  const recurringCount = await prisma.recurringExpense.count({ where: { staffId: id } });
  if (expenseCount + recurringCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Staff has linked expenses; set status inactive instead',
    );
  }
  await prisma.staff.delete({ where: { id } });
  return { id };
};

export const StaffService = { list, getById, create, update, remove };
