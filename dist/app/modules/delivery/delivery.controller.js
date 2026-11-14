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
exports.DeliveryController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
// Drive service no longer needed at read path — public URLs used directly
const notifier_1 = require("../../utils/notifier");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
function resolveUserFromToken(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = req.query.token ||
            ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace(/^Bearer\s+/i, ''));
        if (!token)
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'token required');
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_token_secret);
        }
        catch (_b) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'invalid token');
        }
        const email = decoded.email;
        if (!email)
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'invalid token');
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'user not found');
        return user;
    });
}
function getOwnedBooking(req, bookingId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        let userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        let role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            const u = yield resolveUserFromToken(req);
            userId = u.id;
            role = u.role;
        }
        const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
        if (!booking)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
        if (role !== 'ADMIN' && role !== 'MANAGER' && booking.userId !== userId) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your booking');
        }
        if (!booking.deliveryFolderId) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Not delivered yet');
        }
        return booking;
    });
}
const myDeliveries = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const where = { deliveredAt: { not: null } };
    if (role !== 'ADMIN' && role !== 'MANAGER')
        where.userId = userId;
    const data = yield prisma_1.default.booking.findMany({
        where,
        orderBy: { deliveredAt: 'desc' },
        select: {
            id: true,
            date: true,
            deliveredAt: true,
            deliveryFolderName: true,
            status: true,
            service: { select: { id: true, title: true } },
        },
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Deliveries retrieved',
        data,
    });
}));
const getDelivery = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const booking = yield getOwnedBooking(req, req.params.bookingId);
    const folderId = req.query.folderId || booking.deliveryFolderId;
    // Validate folderId is within delivery tree (DB-only check)
    if (folderId !== booking.deliveryFolderId) {
        const f = yield prisma_1.default.deliveryFile.findFirst({
            where: { bookingId: booking.id, fileId: folderId, isFolder: true },
        });
        if (!f) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Folder not in delivery tree');
        }
    }
    const files = yield prisma_1.default.deliveryFile.findMany({
        where: { bookingId: booking.id, parentFolderId: folderId },
        orderBy: [{ isFolder: 'desc' }, { fileName: 'asc' }],
    });
    // Active editable print request for this owner (if any)
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.resolvedUserId;
    let activePrintRequest = null;
    if (userId && userId === booking.userId) {
        activePrintRequest = yield prisma_1.default.printRequest.findFirst({
            where: {
                bookingId: booking.id,
                userId,
                status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
            },
            include: { selections: { select: { fileId: true } } },
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Delivery retrieved',
        data: {
            booking: {
                id: booking.id,
                deliveredAt: booking.deliveredAt,
                folderName: booking.deliveryFolderName,
                printLimit: (_b = booking.printLimit) !== null && _b !== void 0 ? _b : 0,
            },
            currentFolderId: folderId,
            isRoot: folderId === booking.deliveryFolderId,
            files: files.map((f) => ({
                id: f.fileId,
                name: f.fileName,
                mimeType: f.mimeType,
                size: f.size,
            })),
            nextPageToken: null,
            activePrintRequest: activePrintRequest
                ? {
                    id: activePrintRequest.id,
                    status: activePrintRequest.status,
                    maxPhotos: activePrintRequest.maxPhotos,
                    selectedFileIds: activePrintRequest.selections.map((s) => s.fileId),
                }
                : null,
        },
    });
}));
const downloadFile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield getOwnedBooking(req, req.params.bookingId);
    const fileId = req.params.fileId;
    const row = yield prisma_1.default.deliveryFile.findFirst({
        where: { bookingId: booking.id, fileId },
    });
    if (!row) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'File not in delivery');
    }
    const wantsDownload = req.query.download === '1';
    const url = wantsDownload
        ? `https://drive.google.com/uc?export=download&id=${fileId}`
        : `https://drive.google.com/uc?export=view&id=${fileId}`;
    return res.redirect(url);
}));
const thumbnail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield getOwnedBooking(req, req.params.bookingId);
    const fileId = req.params.fileId;
    const row = yield prisma_1.default.deliveryFile.findFirst({
        where: { bookingId: booking.id, fileId },
    });
    if (!row) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'File not in delivery');
    }
    // Drive public thumbnail endpoint — no token, no expiry
    return res.redirect(`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`);
}));
const stream = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield resolveUserFromToken(req);
    (0, notifier_1.subscribe)(user.id, res);
}));
exports.DeliveryController = {
    myDeliveries,
    getDelivery,
    downloadFile,
    thumbnail,
    stream,
};
