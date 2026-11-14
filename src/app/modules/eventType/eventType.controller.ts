import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { EventTypeService } from './eventType.service';

const list = catchAsync(async (req, res) => {
  const onlyActive =
    req.query.active === '1' || req.query.active === 'true';
  const data = await EventTypeService.list(onlyActive);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Event types',
    data,
  });
});

const create = catchAsync(async (req, res) => {
  const data = await EventTypeService.create(req.body || {});
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Event type created',
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await EventTypeService.update(
    req.params.id as string,
    req.body || {},
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Event type updated',
    data,
  });
});

const remove = catchAsync(async (req, res) => {
  const result = await EventTypeService.remove(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.deactivated
      ? 'This event type is used on existing bookings, so it was deactivated instead of deleted. It no longer appears in active dropdowns.'
      : 'Event type deleted',
    data: result.data,
  });
});

export const EventTypeController = { list, create, update, remove };
