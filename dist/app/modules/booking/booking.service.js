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
exports.BookingService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const discount_service_1 = require("../discount/discount.service");
const discount_calc_1 = require("../discount/discount.calc");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const createBooking = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        // Resolve service amount for subtotal
        const service = yield tx.service.findUnique({
            where: { id: payload.serviceId },
            select: { id: true, amount: true },
        });
        if (!service)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Service not found');
        const subtotal = service.amount;
        const booking = yield tx.booking.create({
            data: {
                userId: payload.userId,
                serviceId: payload.serviceId,
                date: new Date(payload.date),
                subtotal,
                discountAmount: 0,
                totalAmount: subtotal,
                customerName: payload.customerName || null,
                customerEmail: payload.customerEmail || null,
                customerPhone: payload.customerPhone || null,
                notes: payload.notes || null,
                events: ((_a = payload.events) === null || _a === void 0 ? void 0 : _a.length)
                    ? {
                        create: payload.events.map((e, i) => ({
                            packageDayId: e.packageDayId || null,
                            eventTypeId: e.eventTypeId,
                            date: new Date(e.date),
                            venue: e.venue || null,
                            notes: e.notes || null,
                            sortOrder: i,
                        })),
                    }
                    : undefined,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                service: { select: { id: true, title: true, amount: true } },
                events: { include: { eventType: true }, orderBy: { sortOrder: 'asc' } },
                bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
            },
        });
        if (subtotal > 0) {
            const { discountAmount, applied } = yield discount_service_1.DiscountService.applyAtBookingCreation({
                tx,
                bookingId: booking.id,
                serviceId: payload.serviceId,
                subtotal,
                userId: payload.userId,
                couponCode: payload.couponCode,
                adminId: (_b = payload.adminId) !== null && _b !== void 0 ? _b : payload.userId,
            });
            if (applied) {
                const totalAmount = subtotal - discountAmount;
                yield tx.booking.update({
                    where: { id: booking.id },
                    data: { discountAmount, totalAmount },
                });
                return Object.assign(Object.assign({}, booking), { discountAmount, totalAmount });
            }
        }
        return booking;
    }));
});
const getAllBookings = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, userId, } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    const where = {};
    if (status)
        where.status = status;
    if (userId)
        where.userId = userId;
    if (searchTerm) {
        where.OR = [
            { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
            { service: { title: { contains: searchTerm, mode: 'insensitive' } } },
        ];
    }
    const [data, total] = yield Promise.all([
        prisma_1.default.booking.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: { select: { id: true, name: true, email: true } },
                service: { select: { id: true, title: true, amount: true } },
                payment: {
                    include: {
                        paymentMethod: true,
                        invoices: { orderBy: { createdAt: 'desc' } },
                    },
                },
                events: {
                    include: { eventType: true },
                    orderBy: { sortOrder: 'asc' },
                },
                bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
            },
        }),
        prisma_1.default.booking.count({ where }),
    ]);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
});
const getSingleBooking = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.booking.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            service: true,
            events: { include: { eventType: true }, orderBy: { sortOrder: 'asc' } },
            bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
        },
    });
});
const updateBooking = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {};
    if (payload.status)
        data.status = payload.status;
    if (payload.date)
        data.date = new Date(payload.date);
    return prisma_1.default.booking.update({
        where: { id },
        data,
        include: {
            user: { select: { id: true, name: true, email: true } },
            service: { select: { id: true, title: true, amount: true } },
            bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
        },
    });
});
const deleteBooking = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Fetch the BookingDiscount before deleting the booking
        // If discountId is set, decrement usageCount on the Discount
        const bd = yield tx.bookingDiscount.findUnique({ where: { bookingId: id } });
        if (bd === null || bd === void 0 ? void 0 : bd.discountId) {
            yield tx.discount.update({
                where: { id: bd.discountId },
                data: { usageCount: { decrement: 1 } },
            });
        }
        // Now delete the booking (cascade will remove BookingDiscount)
        return tx.booking.delete({ where: { id } });
    }));
});
const markDelivered = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        deliveryFolderId: payload.folderId,
        deliveryFolderName: payload.folderName || null,
        deliveredAt: new Date(),
        status: 'DELIVERED',
    };
    if (typeof payload.printLimit === 'number' && payload.printLimit >= 0) {
        data.printLimit = payload.printLimit;
    }
    const booking = yield prisma_1.default.booking.update({
        where: { id },
        data,
        include: {
            user: { select: { id: true, name: true, email: true } },
            service: { select: { id: true, title: true } },
            bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
        },
    });
    if (typeof data.printLimit === 'number') {
        yield syncEditableRequests(id, data.printLimit);
    }
    // Snapshot: make folder public + cache tree to DB
    try {
        const { setFolderPublic, snapshotDeliveryTree } = yield Promise.resolve().then(() => __importStar(require('../googleDrive/googleDrive.service')));
        yield setFolderPublic(payload.folderId);
        const rows = yield snapshotDeliveryTree(payload.folderId, payload.folderName || 'Delivery');
        yield prisma_1.default.deliveryFile.deleteMany({ where: { bookingId: id } });
        if (rows.length) {
            yield prisma_1.default.deliveryFile.createMany({
                data: rows.map((r) => ({
                    bookingId: id,
                    fileId: r.fileId,
                    fileName: r.fileName,
                    mimeType: r.mimeType,
                    size: r.size,
                    isFolder: r.isFolder,
                    parentFolderId: r.parentFolderId,
                    parentFolderName: r.parentFolderName,
                })),
                skipDuplicates: true,
            });
        }
    }
    catch (e) {
        console.warn('[deliver] snapshot failed:', e.message);
    }
    return booking;
});
function syncEditableRequests(bookingId, newLimit) {
    return __awaiter(this, void 0, void 0, function* () {
        // Mirror new limit onto any editable request for this booking
        yield prisma_1.default.printRequest.updateMany({
            where: {
                bookingId,
                status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
            },
            data: { maxPhotos: newLimit },
        });
        // If new limit < current selections, trim oldest selections to fit
        const editables = yield prisma_1.default.printRequest.findMany({
            where: {
                bookingId,
                status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
            },
            include: { selections: { orderBy: { createdAt: 'asc' } } },
        });
        for (const req of editables) {
            if (req.selections.length > newLimit) {
                const toDelete = req.selections.slice(0, req.selections.length - newLimit);
                yield prisma_1.default.printSelection.deleteMany({
                    where: { id: { in: toDelete.map((s) => s.id) } },
                });
            }
        }
    });
}
const refreshSnapshot = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.findUnique({ where: { id } });
    if (!booking)
        throw new Error('Booking not found');
    if (!booking.deliveryFolderId)
        throw new Error('Booking not delivered');
    const { setFolderPublic, snapshotDeliveryTree } = yield Promise.resolve().then(() => __importStar(require('../googleDrive/googleDrive.service')));
    yield setFolderPublic(booking.deliveryFolderId);
    const rows = yield snapshotDeliveryTree(booking.deliveryFolderId, booking.deliveryFolderName || 'Delivery');
    yield prisma_1.default.deliveryFile.deleteMany({ where: { bookingId: id } });
    if (rows.length) {
        yield prisma_1.default.deliveryFile.createMany({
            data: rows.map((r) => ({
                bookingId: id,
                fileId: r.fileId,
                fileName: r.fileName,
                mimeType: r.mimeType,
                size: r.size,
                isFolder: r.isFolder,
                parentFolderId: r.parentFolderId,
                parentFolderName: r.parentFolderName,
            })),
            skipDuplicates: true,
        });
    }
    return { count: rows.length };
});
const applyAdHocDiscount = (bookingId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const booking = yield tx.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true, bookingDiscount: true },
        });
        if (!booking)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
        if (booking.bookingDiscount) {
            // if previous was AUTO_SALE/COUPON, decrement usageCount
            if (booking.bookingDiscount.discountId) {
                yield tx.discount.update({
                    where: { id: booking.bookingDiscount.discountId },
                    data: { usageCount: { decrement: 1 } },
                });
            }
            yield tx.bookingDiscount.delete({ where: { bookingId } });
        }
        const amount = (0, discount_calc_1.computeDiscountAmount)({
            subtotal: booking.subtotal,
            type: input.type,
            value: input.value,
        });
        yield tx.bookingDiscount.create({
            data: {
                bookingId,
                discountId: null,
                source: 'AD_HOC',
                type: input.type,
                value: input.value,
                amount,
                reason: input.reason,
                appliedById: input.adminId,
            },
        });
        const newTotal = +(booking.subtotal - amount).toFixed(2);
        yield tx.booking.update({
            where: { id: bookingId },
            data: { discountAmount: amount, totalAmount: newTotal },
        });
        if (booking.payment) {
            const paid = (_a = booking.payment.paidAmount) !== null && _a !== void 0 ? _a : 0;
            const refundDue = paid > newTotal ? +(paid - newTotal).toFixed(2) : 0;
            yield tx.payment.update({
                where: { id: booking.payment.id },
                data: { totalAmount: newTotal, refundDueAmount: refundDue },
            });
        }
        return { bookingId, discountAmount: amount, totalAmount: newTotal };
    }));
});
const removeBookingDiscount = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const booking = yield tx.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true, bookingDiscount: true },
        });
        if (!booking)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
        if (!booking.bookingDiscount) {
            return { bookingId, discountAmount: 0, totalAmount: booking.subtotal };
        }
        if (booking.bookingDiscount.discountId) {
            yield tx.discount.update({
                where: { id: booking.bookingDiscount.discountId },
                data: { usageCount: { decrement: 1 } },
            });
        }
        yield tx.bookingDiscount.delete({ where: { bookingId } });
        const newTotal = booking.subtotal;
        yield tx.booking.update({
            where: { id: bookingId },
            data: { discountAmount: 0, totalAmount: newTotal },
        });
        if (booking.payment) {
            yield tx.payment.update({
                where: { id: booking.payment.id },
                data: { totalAmount: newTotal, refundDueAmount: 0 },
            });
        }
        return { bookingId, discountAmount: 0, totalAmount: newTotal };
    }));
});
const setPrintLimit = (id, printLimit) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.update({
        where: { id },
        data: { printLimit },
    });
    yield syncEditableRequests(id, printLimit);
    return booking;
});
exports.BookingService = {
    createBooking,
    getAllBookings,
    getSingleBooking,
    updateBooking,
    deleteBooking,
    markDelivered,
    setPrintLimit,
    refreshSnapshot,
    applyAdHocDiscount,
    removeBookingDiscount,
};
