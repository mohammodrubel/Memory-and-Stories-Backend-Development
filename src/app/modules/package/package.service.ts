import httpStatus from "http-status";
import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import { resolveAutoSaleForService } from "../discount/discount.service";

export interface IPackageSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
}

const createServiceService = async (payload: any) => {
  const { title, description, amount, days } = payload;

  return await prisma.service.create({
    data: {
      title,
      description,
      amount: Number(amount),

      days: {
        create: days?.map((day: any) => ({
          dayName: day.dayName,

          events: {
            create: day.events?.map((event: any) => ({
              eventName: event.eventName,
              photographers: Number(event.photographers),
              cinematographers: Number(event.cinematographers),

              features: {
                create: event.features?.map((name: string) => ({
                  name,
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      days: {
        include: {
          events: {
            include: {
              features: true,
            },
          },
        },
      },
    },
  });
};


 // GET ALL with search, filter, pagination
 const getAllServicesService = async (options: IPackageSearchOptions) => {
  const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', includeArchived = false } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: any = includeArchived ? {} : { archived: false };
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
    ];
  }

  const [result, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        days: {
          include: {
            events: {
              include: {
                features: true,
              },
            },
          },
        },
      },
    }),
    prisma.service.count({ where }),
  ]);

  // Attach auto-sale pricing to each service
  const dataWithSale = await Promise.all(
    result.map(async (svc) => {
      const sale = await resolveAutoSaleForService(svc.id, svc.amount);
      return {
        ...svc,
        onSale: sale !== null,
        effectivePrice: sale ? svc.amount - sale.amount : svc.amount,
        saleDiscount: sale ?? null,
      };
    }),
  );

  return {
    data: dataWithSale,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


export const getSingleServiceService = async (id: string) => {
  return await prisma.service.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          events: {
            include: {
              features: true,
            },
          },
        },
      },
    },
  });
};


 // Packages referenced by existing bookings can't be hard-deleted without
 // breaking those records (Booking.serviceId is a required FK) — archive
 // instead so it disappears from the storefront but booking history stays intact.
 const deleteServiceService = async (id: string) => {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  const bookingCount = await prisma.booking.count({ where: { serviceId: id } });

  if (bookingCount > 0) {
    const archived = await prisma.service.update({
      where: { id },
      data: { archived: true },
    });
    return { archived: true, deleted: false, data: archived };
  }

  const deleted = await prisma.service.delete({ where: { id } });
  return { archived: false, deleted: true, data: deleted };
};
 const updateService = async (id: string, payload: any) => {
  const { title, description, amount, days } = payload;

  // Step 1: delete old nested data (safe reset)
  await prisma.feature.deleteMany({
    where: {
      event: {
        day: {
          serviceId: id,
        },
      },
    },
  });

  await prisma.event.deleteMany({
    where: {
      day: {
        serviceId: id,
      },
    },
  });

  await prisma.day.deleteMany({
    where: {
      serviceId: id,
    },
  });

  // Step 2: update main service + recreate structure
  return await prisma.service.update({
    where: { id },
    data: {
      title,
      description,
      amount: Number(amount),

      days: {
        create: days?.map((day: any) => ({
          dayName: day.dayName,

          events: {
            create: day.events?.map((event: any) => ({
              eventName: event.eventName,
              photographers: Number(event.photographers),
              cinematographers: Number(event.cinematographers),

              features: {
                create: event.features?.map((name: string) => ({
                  name,
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      days: {
        include: {
          events: {
            include: {
              features: true,
            },
          },
        },
      },
    },
  });
};



export const PackageService = {
    createServiceService,
    getAllServicesService,
    getSingleServiceService,
    updateService,
    deleteServiceService
}