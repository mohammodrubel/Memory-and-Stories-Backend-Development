import { OrderStatus, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

export interface IOrderSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: OrderStatus;
  userId?: string;
}

export interface IOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface ICreateOrderPayload {
  userId: string;
  items: IOrderItemPayload[];
}

const createOrder = async (payload: ICreateOrderPayload) => {
  const { userId, items } = payload;
  if (!items?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order must contain at least one item');
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'One or more products were not found');
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + product.price * item.quantity;
  }, 0);

  return prisma.order.create({
    data: {
      userId,
      total,
      items: {
        create: items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          };
        }),
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
};

const getAllOrders = async (options: IOrderSearchOptions) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    userId,
  } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (searchTerm) {
    where.OR = [
      { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.order.count({ where }),
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

const getSingleOrder = async (id: string) => {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
};

const updateOrder = async (id: string, payload: { status?: OrderStatus }) => {
  return prisma.order.update({
    where: { id },
    data: { status: payload.status },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
};

const deleteOrder = async (id: string) => {
  return prisma.order.delete({ where: { id } });
};

export const OrderService = {
  createOrder,
  getAllOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
};
