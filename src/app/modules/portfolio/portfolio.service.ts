import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';

export interface IPortfolioSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categoryId?: string;
}

export interface IPortfolioPayload {
  image: string;
  title?: string;
  description?: string;
  categoryIds: string[];
  sortOrder?: number;
}

const include = {
  categories: { include: { category: true } },
} satisfies Prisma.PortfolioInclude;

type Row = Prisma.PortfolioGetPayload<{ include: typeof include }>;

// Flatten join rows to `categories: [{id, name}]`, sorted by name for stable output.
const shape = (row: Row) => {
  const { categories, ...rest } = row;
  return {
    ...rest,
    categories: categories
      .map((l) => ({ id: l.category.id, name: l.category.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// Primary: admin sort number ascending. Ties: newest first, then id.
const tieBreak: Prisma.PortfolioOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'asc' }];

const uniq = (ids: string[]) => Array.from(new Set(ids));

const assertCategoriesExist = async (ids: string[]) => {
  const found = await prisma.portfolioCategory.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw new AppError(httpStatus.BAD_REQUEST, 'One or more categories do not exist');
};

const nextSortOrder = async () => {
  const agg = await prisma.portfolio.aggregate({ _max: { sortOrder: true } });
  return (agg?._max?.sortOrder ?? 0) + 1;
};

const createPortfolio = async (payload: IPortfolioPayload) => {
  const ids = uniq(payload.categoryIds || []);
  if (!ids.length) throw new AppError(httpStatus.BAD_REQUEST, 'Select at least one category');
  await assertCategoriesExist(ids);
  const sortOrder = payload.sortOrder ?? (await nextSortOrder());

  const row = await prisma.portfolio.create({
    data: {
      image: payload.image,
      title: payload.title || undefined,
      description: payload.description || undefined,
      sortOrder,
      categories: { create: ids.map((categoryId) => ({ categoryId })) },
    },
    include,
  });
  return shape(row);
};

const getAllPortfolios = async (options: IPortfolioSearchOptions) => {
  const { searchTerm, page = 1, limit = 10, sortBy = 'sortOrder', sortOrder, categoryId } = options;

  const skip = (page - 1) * limit;
  const where: Prisma.PortfolioWhereInput = {};
  if (categoryId) where.categories = { some: { categoryId } };
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Only whitelisted sort keys; default is the admin-assigned sort number ascending.
  const dir = sortOrder === 'desc' ? 'desc' : 'asc';
  const orderBy: Prisma.PortfolioOrderByWithRelationInput[] =
    sortBy === 'createdAt'
      ? [{ createdAt: sortOrder === 'asc' ? 'asc' : 'desc' }, { id: 'asc' }]
      : [{ sortOrder: dir }, ...tieBreak];

  const [rows, total] = await Promise.all([
    prisma.portfolio.findMany({ where, skip, take: limit, orderBy, include }),
    prisma.portfolio.count({ where }),
  ]);

  return {
    data: rows.map(shape),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getSinglePortfolio = async (id: string) => {
  const row = await prisma.portfolio.findUnique({ where: { id }, include });
  return row ? shape(row) : null;
};

const updatePortfolio = async (id: string, payload: Partial<IPortfolioPayload>) => {
  const data: Prisma.PortfolioUpdateInput = {};
  if (payload.image !== undefined) data.image = payload.image;
  if (payload.title !== undefined) data.title = payload.title || null;
  if (payload.description !== undefined) data.description = payload.description || null;
  if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder; // never auto-overwritten
  if (payload.categoryIds) {
    const ids = uniq(payload.categoryIds);
    await assertCategoriesExist(ids);
    data.categories = { deleteMany: {}, create: ids.map((categoryId) => ({ categoryId })) };
  }
  const row = await prisma.portfolio.update({ where: { id }, data, include });
  return shape(row);
};

const deletePortfolio = async (id: string) => {
  return prisma.portfolio.delete({ where: { id } });
};

export const PortfolioService = {
  createPortfolio,
  getAllPortfolios,
  getSinglePortfolio,
  updatePortfolio,
  deletePortfolio,
};
