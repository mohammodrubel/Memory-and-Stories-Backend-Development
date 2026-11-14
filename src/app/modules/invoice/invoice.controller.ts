import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { InvoiceService } from './invoice.service';

const getInvoices = catchAsync(async (req, res) => {
  const { page, limit, userId, source } = req.query;
  const result = await InvoiceService.getInvoices({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    userId: userId as string,
    source: (source as 'ORDER' | 'BOOKING' | 'ALL') ?? 'ALL',
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Invoices retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMyInvoices = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const { page, limit } = req.query;
  const result = await InvoiceService.getInvoices({
    userId,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Your invoices retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const InvoiceController = {
  getInvoices,
  getMyInvoices,
};
