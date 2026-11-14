import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { PortfolioService } from './portfolio.service';

const createPortfolio = catchAsync(async (req, res) => {
  const result = await PortfolioService.createPortfolio(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Portfolio created successfully',
    data: result,
  });
});

const getAllPortfolios = catchAsync(async (req, res) => {
  const { search, page, limit, sortBy, sortOrder, categoryId } = req.query;
  const result = await PortfolioService.getAllPortfolios({
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    categoryId: categoryId as string,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Portfolios retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSinglePortfolio = catchAsync(async (req, res) => {
  const result = await PortfolioService.getSinglePortfolio(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Portfolio retrieved successfully',
    data: result,
  });
});

const updatePortfolio = catchAsync(async (req, res) => {
  const result = await PortfolioService.updatePortfolio(req.params.id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Portfolio updated successfully',
    data: result,
  });
});

const deletePortfolio = catchAsync(async (req, res) => {
  const result = await PortfolioService.deletePortfolio(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Portfolio deleted successfully',
    data: result,
  });
});

export const PortfolioController = {
  createPortfolio,
  getAllPortfolios,
  getSinglePortfolio,
  updatePortfolio,
  deletePortfolio,
};
