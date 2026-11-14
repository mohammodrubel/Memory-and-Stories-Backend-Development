import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { OverviewService } from './overview.service';

const getOverview = catchAsync(async (_req, res) => {
  const result = await OverviewService.getOverview();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Overview retrieved successfully',
    data: result,
  });
});

export const OverviewController = {
  getOverview,
};
