import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

export interface IProductSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  includeArchived?: boolean;
}

export interface IProductPayload {
  name: string;
  price: number;
  image: string;
  description?: string;
  archived?: boolean;
}

const createProduct = async (payload: IProductPayload) => {
  return prisma.product.create({
    data: {
      name: payload.name,
      price: Number(payload.price),
      image: payload.image,
      description: payload.description,
    },
  });
};

const getAllProducts = async (options: IProductSearchOptions) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minPrice,
    maxPrice,
    includeArchived = false,
  } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.ProductWhereInput = includeArchived ? {} : { archived: false };
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.product.count({ where }),
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

const getSingleProduct = async (id: string) => {
  return prisma.product.findUnique({ where: { id } });
};

const updateProduct = async (id: string, payload: Partial<IProductPayload>) => {
  const data: Prisma.ProductUpdateInput = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.price !== undefined) data.price = Number(payload.price);
  if (payload.image !== undefined) data.image = payload.image;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.archived !== undefined) data.archived = payload.archived;

  return prisma.product.update({ where: { id }, data });
};

// Products referenced by existing orders can't be hard-deleted without breaking
// those order records (OrderItem.productId is a required FK) — archive instead
// so it disappears from the shop while order history stays intact.
const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderItemCount > 0) {
    const archived = await prisma.product.update({
      where: { id },
      data: { archived: true },
    });
    return { archived: true, deleted: false, data: archived };
  }

  const deleted = await prisma.product.delete({ where: { id } });
  return { archived: false, deleted: true, data: deleted };
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
