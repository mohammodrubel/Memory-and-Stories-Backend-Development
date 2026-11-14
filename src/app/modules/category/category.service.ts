import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';

export interface ICategorySearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const createCategory = async (payload: { name: string }) => {
  return prisma.category.create({ data: { name: payload.name } });
};

const getAllCategories = async (options: ICategorySearchOptions) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.CategoryWhereInput = searchTerm
    ? {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { portfolios: true } } },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getSingleCategory = async (id: string) => {
  return prisma.category.findUnique({
    where: { id },
    include: { portfolios: true },
  });
};

const updateCategory = async (id: string, payload: { name: string }) => {
  return prisma.category.update({
    where: { id },
    data: { name: payload.name },
  });
};

const deleteCategory = async (id: string) => {
  return prisma.category.delete({ where: { id } });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
