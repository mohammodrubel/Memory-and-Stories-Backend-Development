import prisma from "../../utils/prisma";

export interface IServiceSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// CREATE
const createNewService = async (payload: {
  title: string;
  description: string;
  price: number;
  image: string;
}) => {
  const result = await prisma.service2.create({
    data: payload,
  });

  return result;
};

// GET ALL with search, filter, pagination
const getAllService = async (options: IServiceSearchOptions) => {
  const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const skip = (page - 1) * limit;
  const take = limit;

  const where = searchTerm ? {
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
    ],
  } : {};

  const [result, total] = await Promise.all([
    prisma.service2.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.service2.count({ where }),
  ]);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET SINGLE
const getSingleService = async (id: string) => {
  const result = await prisma.service2.findUnique({
    where: {
      id,
    },
  });

  return result;
};

// UPDATE
const updateService = async (
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    price: number;
    image: string;
  }>
) => {
  const result = await prisma.service2.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

// DELETE
const deleteService = async (id: string) => {
  const result = await prisma.service2.delete({
    where: {
      id,
    },
  });

  return result;
};

export const ServiceService = {
  createNewService,
  getAllService,
  getSingleService,
  updateService,
  deleteService,
};