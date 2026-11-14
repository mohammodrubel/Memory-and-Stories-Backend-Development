import { Banner } from "@prisma/client";
import prisma from "../../utils/prisma";
import { deleteUploadedFileIfLocal } from "../../utils/deleteUploadedFile";

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IBannerSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

 const createNewBanner = async (payload:Banner) => {
  const result = await prisma.banner.create({
    data:payload,
  });

  return result
};

// GET ALL with search, filter, pagination
 const getAllBanner = async (options: IBannerSearchOptions) => {
  const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const skip = (page - 1) * limit;
  const take = limit;

  const where = searchTerm ? {
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { short_title: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
    ],
  } : {};

  const [result, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.banner.count({ where }),
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
 const getSingleBanner = async (id:string) => {

  const result = await prisma.banner.findUnique({
    where: { id },
  });

  return result
 
};

// UPDATE
 const updateBanner =  async (id:string, payload:Partial<Banner>) => {
  const existing = await prisma.banner.findUnique({ where: { id } });

  const result = await prisma.banner.update({
    where: { id },
    data: payload,
  });

  // Image was replaced (not just resent unchanged) — drop the orphaned old file.
  if (
    existing?.image &&
    payload.image !== undefined &&
    payload.image !== existing.image
  ) {
    deleteUploadedFileIfLocal(existing.image);
  }

return result

}

// DELETE
 const deleteBanner = async(id:string) => {

  const result = await prisma.banner.delete({
    where: { id },
  });

  deleteUploadedFileIfLocal(result.image);

  return result

};



export const BannerService = {
    createNewBanner,
    updateBanner,
    getAllBanner,
    getSingleBanner,
    deleteBanner
}