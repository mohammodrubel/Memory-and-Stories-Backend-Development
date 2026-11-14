import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { PackageService } from "./package.service";

const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await PackageService.createServiceService(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Service created successfully",
    data: result,
  });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const { search, page, limit, sortBy, sortOrder, includeArchived } = req.query;

  const options = {
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    includeArchived: includeArchived === '1' || includeArchived === 'true',
  };

  const result = await PackageService.getAllServicesService(options);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Services retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await PackageService.getSingleServiceService(id as string);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Service retrieved successfully",
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await PackageService.deleteServiceService(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.archived
      ? "This package has existing bookings, so it was archived instead of deleted. It no longer appears on the storefront."
      : "Service deleted successfully",
    data: result.data,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await PackageService.updateService(id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Service updated successfully",
    data: result,
  });
});

export const PackageController = {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
};
