import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import {
  pushBookingToGcal,
  removeBookingFromGcal,
  listBookingsForRange,
} from './calendar.service';

const listRange = catchAsync(async (req, res) => {
  const start = String(req.query.start || '');
  const end = String(req.query.end || '');
  if (!start || !end) {
    throw new AppError(httpStatus.BAD_REQUEST, 'start + end query required');
  }
  const rows = await listBookingsForRange(start, end);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Calendar bookings',
    data: rows,
  });
});

const push = catchAsync(async (req, res) => {
  const r = await pushBookingToGcal(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: r.updated ? 'GCal event updated' : 'GCal event created',
    data: r,
  });
});

const remove = catchAsync(async (req, res) => {
  const r = await removeBookingFromGcal(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'GCal event removed',
    data: r,
  });
});

export const CalendarController = { listRange, push, remove };
