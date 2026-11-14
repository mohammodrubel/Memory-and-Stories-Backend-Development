"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.BookingController = void 0;
const client_1 = require("@prisma/client");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const booking_service_1 = require("./booking.service");
const createBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Only authed user id from token — never body — to prevent owner spoofing
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId)
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Not authenticated');
    const result = yield booking_service_1.BookingService.createBooking(Object.assign(Object.assign({}, req.body), { userId }));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Booking created successfully',
        data: result,
    });
}));
const getAllBookings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Admin-only route — userId query filter allowed
    const { search, page, limit, sortBy, sortOrder, status, userId } = req.query;
    const result = yield booking_service_1.BookingService.getAllBookings({
        searchTerm: search,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        sortBy: sortBy,
        sortOrder: sortOrder,
        status: status ? status : undefined,
        userId: userId,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Bookings retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getMyBookings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { page, limit, status } = req.query;
    const result = yield booking_service_1.BookingService.getAllBookings({
        userId,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status: status ? status : undefined,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Your bookings retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getSingleBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const result = yield booking_service_1.BookingService.getSingleBooking(req.params.id);
    if (!result)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    // Owner check: USER can only see own; ADMIN sees any
    if (role !== client_1.Role.ADMIN && role !== client_1.Role.MANAGER && result.userId !== userId)
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your booking');
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Booking retrieved successfully',
        data: result,
    });
}));
const updateBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield booking_service_1.BookingService.updateBooking(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Booking updated successfully',
        data: result,
    });
}));
const deliverBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { folderId, folderName, printLimit } = req.body || {};
    if (!folderId || typeof folderId !== 'string') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'folderId required');
    }
    const result = yield booking_service_1.BookingService.markDelivered(req.params.id, {
        folderId,
        folderName,
        printLimit: typeof printLimit === 'number' && printLimit >= 0
            ? Math.floor(printLimit)
            : undefined,
    });
    // Persist notification (durable) — service also emits SSE
    try {
        const { createNotification } = yield Promise.resolve().then(() => __importStar(require('../notification/notification.service')));
        yield createNotification({
            userId: result.userId,
            type: 'delivery.ready',
            title: `Your ${((_a = result.service) === null || _a === void 0 ? void 0 : _a.title) || 'booking'} is ready`,
            body: result.deliveryFolderName || null,
            data: {
                bookingId: result.id,
                link: `/dashboard/user/deliveries/${result.id}`,
                folderName: result.deliveryFolderName,
                deliveredAt: result.deliveredAt,
            },
        });
    }
    catch (e) {
        console.warn('[deliver] notify failed:', e.message);
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Booking marked delivered',
        data: result,
    });
}));
const deleteBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield booking_service_1.BookingService.deleteBooking(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Booking deleted successfully',
        data: result,
    });
}));
const setPrintLimit = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { printLimit } = req.body || {};
    const n = Number(printLimit);
    if (!Number.isFinite(n) || n < 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'printLimit must be >= 0');
    }
    const result = yield booking_service_1.BookingService.setPrintLimit(req.params.id, Math.floor(n));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Print limit updated',
        data: result,
    });
}));
const refreshSnapshot = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield booking_service_1.BookingService.refreshSnapshot(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Snapshot refreshed',
        data: result,
    });
}));
const applyAdHocDiscount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield booking_service_1.BookingService.applyAdHocDiscount(req.params.id, Object.assign(Object.assign({}, req.body), { adminId: req.user.id }));
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Discount applied', data: result });
}));
const removeBookingDiscount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield booking_service_1.BookingService.removeBookingDiscount(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Discount removed', data: result });
}));
exports.BookingController = {
    createBooking,
    getAllBookings,
    getMyBookings,
    getSingleBooking,
    updateBooking,
    deleteBooking,
    deliverBooking,
    setPrintLimit,
    refreshSnapshot,
    applyAdHocDiscount,
    removeBookingDiscount,
};
