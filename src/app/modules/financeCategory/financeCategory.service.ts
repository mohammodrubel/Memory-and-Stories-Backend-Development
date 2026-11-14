import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const DEFAULT_EXPENSE = [
  'Rent',
  'Utility',
  'Salary',
  'Internet',
  'Equipment',
  'Marketing',
  'Transport',
  'Other',
];
const DEFAULT_INCOME = ['Booking', 'Print Sales', 'Equipment Rental', 'Other'];

const seedIfEmpty = async () => {
  const count = await prisma.financeCategory.count();
  if (count > 0) return;
  await prisma.financeCategory.createMany({
    data: [
      ...DEFAULT_EXPENSE.map((name) => ({ name, type: 'EXPENSE' })),
      ...DEFAULT_INCOME.map((name) => ({ name, type: 'INCOME' })),
    ],
    skipDuplicates: true,
  });
};

const list = async (type?: 'EXPENSE' | 'INCOME', includeArchived = false) => {
  await seedIfEmpty();
  return prisma.financeCategory.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(includeArchived ? {} : { archived: false }),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
};

const getById = async (id: string) => {
  const found = await prisma.financeCategory.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  return found;
};

const create = async (data: { name: string; type: 'EXPENSE' | 'INCOME'; color?: string | null }) => {
  try {
    return await prisma.financeCategory.create({ data });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      throw new AppError(httpStatus.CONFLICT, 'Category name already exists for that type');
    }
    throw err;
  }
};

const update = async (id: string, data: Record<string, unknown>) => {
  await getById(id);
  return prisma.financeCategory.update({ where: { id }, data });
};

const remove = async (id: string) => {
  await getById(id);
  const counts = await Promise.all([
    prisma.expense.count({ where: { categoryId: id } }),
    prisma.income.count({ where: { categoryId: id } }),
    prisma.recurringExpense.count({ where: { categoryId: id } }),
  ]);
  if (counts.reduce((a, b) => a + b, 0) > 0) {
    throw new AppError(httpStatus.CONFLICT, 'Category in use; archive instead');
  }
  await prisma.financeCategory.delete({ where: { id } });
  return { id };
};

export const FinanceCategoryService = { list, getById, create, update, remove, seedIfEmpty };
