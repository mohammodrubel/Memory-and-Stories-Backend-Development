import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import {
  listForUser,
  markRead,
  markAllRead,
} from './notification.service';

const list = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const unread = req.query.unread === '1' || req.query.unread === 'true';
  const limit = Number(req.query.limit) || 30;
  const result = await listForUser(userId, { unread, limit });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notifications retrieved',
    data: { items: result.items, unreadCount: result.unreadCount },
  });
});

const read = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const row = await markRead(userId, req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Marked read',
    data: row,
  });
});

const readAll = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const r = await markAllRead(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All marked read',
    data: r,
  });
});

export const NotificationController = { list, read, readAll };
