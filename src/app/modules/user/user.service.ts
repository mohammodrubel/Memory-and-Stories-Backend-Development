import prisma from '../../utils/prisma';

export interface IUserSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
}

// GET ALL with search, filter, pagination
const GetAllUsers = async (options: IUserSearchOptions) => {
  const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', role } = options;
  
  const skip = (page - 1) * limit;
  const take = limit;

  const where: any = {};
  
  if (role) {
    where.role = role;
  }
  
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
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

const GetSingleUser = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  return result;
};

const GetProfile = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return result;
};

const UpdateProfile = async (id: string, data: { name?: string; email?: string }) => {
  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return result;
};

const DeleteUser = async (id: string) => {
  await prisma.user.delete({
    where: {
      id: id,
    },
  });
};

const SetUserRole = async (id: string, role: 'ADMIN' | 'MANAGER' | 'USER') => {
  return prisma.user.update({
    where: { id },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
};

const ExportUsers = async (role?: string) => {
  const where: any = {};
  if (role) where.role = role;
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      role: true,
      createdAt: true,
    },
  });
};


export const UserService = {
  GetAllUsers,
  GetSingleUser,
  GetProfile,
  UpdateProfile,
  DeleteUser,
  ExportUsers,
  SetUserRole,
};
