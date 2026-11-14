import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SiteSettingsService } from './siteSettings.service';

const get = catchAsync(async (_req, res) => {
  const data = await SiteSettingsService.get();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Site settings retrieved',
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await SiteSettingsService.update(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Site settings updated',
    data,
  });
});

export const SiteSettingsController = { get, update };
