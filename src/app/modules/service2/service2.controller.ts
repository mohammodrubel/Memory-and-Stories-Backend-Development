import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ServiceService } from "./service2.service";

// CREATE
const createNewService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.createNewService(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Service created successfully",
    data: result,
  });
});

// GET ALL with search, filter, pagination
const getAllService = catchAsync(async (req: Request, res: Response) => {
  const { search, page, limit, sortBy, sortOrder } = req.query;
  
  const options = {
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };
  
  const result = await ServiceService.getAllService(options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Services fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

// GET SINGLE
const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.getSingleService(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service fetched successfully",
    data: result,
  });
});

// UPDATE
const updateService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.updateService(
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service updated successfully",
    data: result,
  });
});

// DELETE
const deleteService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.deleteService(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service deleted successfully",
    data: result,
  });
});

export const ServiceController = {
  createNewService,
  getAllService,
  getSingleService,
  updateService,
  deleteService,
};