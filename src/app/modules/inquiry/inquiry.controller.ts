import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { InquiryService } from './inquiry.service';

const create = catchAsync(async (req, res) => {
  const { website: _hp, ...body } = req.body;
  const data = await InquiryService.createInquiry(body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Inquiry received', data });
});

const list = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const r = await InquiryService.getAllInquiries({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status: status as string,
  });
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Inquiries retrieved', data: r.data, meta: r.meta });
});

const updateStatus = catchAsync(async (req, res) => {
  const data = await InquiryService.updateStatus(req.params.id as string, req.body.status);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Inquiry updated', data });
});

const remove = catchAsync(async (req, res) => {
  const data = await InquiryService.deleteInquiry(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Inquiry deleted', data });
});

export const InquiryController = { create, list, updateStatus, remove };
