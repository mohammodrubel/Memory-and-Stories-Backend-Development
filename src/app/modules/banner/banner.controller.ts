import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { BannerService } from "./banner.service";
import { sendVideoToCloudinary } from "../../utils/uploadVideoMiddleware";

// CREATE
 const createNewBanner = catchAsync(async (req, res) => {
    const result = await BannerService.createNewBanner(req.body)
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "create banner successfully",
    data: result,
  });
});

// GET ALL with search, filter, pagination
 const getAllBanner = catchAsync(async (req, res) => {
  const { search, page, limit, sortBy, sortOrder } = req.query;
  
  const options = {
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };
  
  const result = await BannerService.getAllBanner(options);
  
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "get all banner successfully",
    data: result.data,
    meta: result.meta,
  });
});

// GET SINGLE
 const getSingleBanner = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await BannerService.getSingleBanner(id as string)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "get single banner successfully",
    data: result,
  });
});

// UPDATE
 const updateBanner = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await BannerService.updateBanner(id as string,req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "update banner successfully",
    data: result,
  });
});

// DELETE
 const deleteBanner = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await BannerService.deleteBanner(id as string)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "delete banner successfully",
    data: result,
  });
});


// UPLOAD VIDEO — returns Cloudinary secure_url
const uploadVideo = catchAsync(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "No video file uploaded",
      data: null,
    });
  }

  const url = await sendVideoToCloudinary(req.file.path, req.file.originalname);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "video uploaded successfully",
    data: { url },
  });
});

export const BannerController = {
    createNewBanner,
    updateBanner,
    getAllBanner,
    getSingleBanner,
    deleteBanner,
    uploadVideo,
}