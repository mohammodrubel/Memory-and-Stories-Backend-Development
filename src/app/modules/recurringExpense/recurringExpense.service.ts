import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const list = async (includeInactive = false) => {
  return prisma.recurringExpense.findMany({
    where: includeInactive ? {} : { active: true },
    include: { category: true, staff: true },
    orderBy: { label: 'asc' },
  });
};

const getById = async (id: string) => {
  const found = await prisma.recurringExpense.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Recurring expense not found');
  return found;
};

const create = async (data: Record<string, unknown>) => {
  return prisma.recurringExpense.create({ data: data as never });
};

const update = async (id: string, data: Record<string, unknown>) => {
  await getById(id);
  return prisma.recurringExpense.update({ where: { id }, data });
};

const remove = async (id: string) => {
  await getById(id);
  await prisma.recurringExpense.delete({ where: { id } });
  return { id };
};

export const RecurringExpenseService = { list, getById, create, update, remove };
