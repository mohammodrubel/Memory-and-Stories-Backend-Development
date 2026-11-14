import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import crypto from 'crypto';
import {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  getFreshAccessToken,
} from './googleDrive.service';
import config from '../../config';

const connect = catchAsync(async (_req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const url = getAuthUrl(state);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Auth URL generated',
    data: { url, state },
  });
});

const callback = catchAsync(async (req, res) => {
  const code = String(req.query.code || '');
  if (!code) {
    return res.status(400).send('Missing code');
  }
  try {
    await handleCallback(code);
    const redirect = `${config.app_base_url}/dashboard/admin/settings/integrations?google=connected`;
    return res.redirect(redirect);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const redirect = `${config.app_base_url}/dashboard/admin/settings/integrations?google=error&message=${encodeURIComponent(msg)}`;
    return res.redirect(redirect);
  }
});

const status = catchAsync(async (_req, res) => {
  const result = await getStatus();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Drive status',
    data: result,
  });
});

const disconnectCtrl = catchAsync(async (_req, res) => {
  const result = await disconnect();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Disconnected',
    data: result,
  });
});

const pickerToken = catchAsync(async (_req, res) => {
  const token = await getFreshAccessToken();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Picker token',
    data: { accessToken: token, apiKey: config.google.api_key, appId: config.google.app_id, clientId: config.google.client_id },
  });
});

export const GoogleDriveController = { connect, callback, status, disconnect: disconnectCtrl, pickerToken };
