import { OrderStatus, Role } from '@prisma/client';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { OrderService } from './order.service';

const createOrder = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, 'Not authenticated');
  const result = await OrderService.createOrder({
    userId,
    items: req.body.items,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Order created successfully',
    data: result,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const { search, page, limit, sortBy, sortOrder, status, userId } = req.query;
  const result = await OrderService.getAllOrders({
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    status: status ? (status as OrderStatus) : undefined,
    userId: userId as string,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Orders retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const { page, limit, status } = req.query;
  const result = await OrderService.getAllOrders({
    userId,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? (status as OrderStatus) : undefined,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Your orders retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const role = (req.user as any)?.role;
  const result = await OrderService.getSingleOrder(req.params.id as string);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  if (role !== Role.ADMIN && role !== Role.MANAGER && result.userId !== userId)
    throw new AppError(httpStatus.FORBIDDEN, 'Not your order');
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const updateOrder = catchAsync(async (req, res) => {
  const result = await OrderService.updateOrder(req.params.id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order updated successfully',
    data: result,
  });
});

const deleteOrder = catchAsync(async (req, res) => {
  const result = await OrderService.deleteOrder(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order deleted successfully',
    data: result,
  });
});

export const OrderController = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
};
