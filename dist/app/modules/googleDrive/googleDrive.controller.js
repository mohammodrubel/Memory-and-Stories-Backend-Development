"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const crypto_1 = __importDefault(require("crypto"));
const googleDrive_service_1 = require("./googleDrive.service");
const config_1 = __importDefault(require("../../config"));
const connect = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const state = crypto_1.default.randomBytes(16).toString('hex');
    const url = (0, googleDrive_service_1.getAuthUrl)(state);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Auth URL generated',
        data: { url, state },
    });
}));
const callback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = String(req.query.code || '');
    if (!code) {
        return res.status(400).send('Missing code');
    }
    try {
        yield (0, googleDrive_service_1.handleCallback)(code);
        const redirect = `${config_1.default.app_base_url}/dashboard/admin/settings/integrations?google=connected`;
        return res.redirect(redirect);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        const redirect = `${config_1.default.app_base_url}/dashboard/admin/settings/integrations?google=error&message=${encodeURIComponent(msg)}`;
        return res.redirect(redirect);
    }
}));
const status = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, googleDrive_service_1.getStatus)();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Drive status',
        data: result,
    });
}));
const disconnectCtrl = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, googleDrive_service_1.disconnect)();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Disconnected',
        data: result,
    });
}));
const pickerToken = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield (0, googleDrive_service_1.getFreshAccessToken)();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Picker token',
        data: { accessToken: token, apiKey: config_1.default.google.api_key, appId: config_1.default.google.app_id, clientId: config_1.default.google.client_id },
    });
}));
exports.GoogleDriveController = { connect, callback, status, disconnect: disconnectCtrl, pickerToken };
