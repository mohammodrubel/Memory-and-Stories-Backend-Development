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
exports.PaymentService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const discount_service_1 = require("../discount/discount.service");
const generateInvoiceNo = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (client = prisma_1.default) {
    const year = new Date().getFullYear();
    const count = yield client.invoice.count({
        where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const seq = String(count + 1).padStart(5, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `INV-${year}-${seq}-${rand}`;
});
const createBookingWithPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const service = yield prisma_1.default.service.findUnique({
        where: { id: payload.serviceId },
        select: { id: true, amount: true, title: true },
    });
    if (!service)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Service not found');
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const booking = yield tx.booking.create({
            data: {
                userId: payload.userId,
                serviceId: payload.serviceId,
                date: new Date(payload.date),
                subtotal: service.amount,
                discountAmount: 0,
                totalAmount: service.amount,
                customerName: payload.customerName,
                customerEmail: payload.customerEmail,
                customerPhone: payload.customerPhone,
                notes: payload.notes,
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
        });
        const { discountAmount, applied } = yield discount_service_1.DiscountService.applyAtBookingCreation({
            tx,
            bookingId: booking.id,
            serviceId: service.id,
            subtotal: service.amount,
            userId: payload.userId,
            couponCode: payload.couponCode,
            adminId: payload.userId,
        });
        const totalAmount = service.amount - discountAmount;
        if (applied) {
            yield tx.booking.update({
                where: { id: booking.id },
                data: { discountAmount, totalAmount },
            });
        }
        const payment = yield tx.payment.create({
            data: {
                bookingId: booking.id,
                userId: payload.userId,
                totalAmount,
                status: client_1.PaymentStatus.AWAITING_PAYMENT,
            },
        });
        return { booking: Object.assign(Object.assign({}, booking), { discountAmount, totalAmount }), payment, appliedDiscount: applied };
    }));
});
const submitScreenshot = (paymentId, userId, screenshotPath, transactionRef, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield prisma_1.default.payment.findUnique({ where: { id: paymentId } });
    if (!payment)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
    if (payment.userId !== userId)
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your payment');
    if (payment.status === client_1.PaymentStatus.PAID || payment.status === client_1.PaymentStatus.REJECTED)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Payment already ${payment.status}`);
    return prisma_1.default.payment.update({
        where: { id: paymentId },
        data: {
            screenshotPath,
            transactionRef,
            paymentMethodId,
            status: client_1.PaymentStatus.SCREENSHOT_SUBMITTED,
        },
    });
});
const approvePayment = (paymentId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.paidAmount <= 0)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'paidAmount must be > 0');
    const runOnce = () => prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Re-read inside tx to serialize concurrent admin approvals.
        // Postgres SERIALIZABLE isolation surfaces conflicts as P2034 (retry below).
        const payment = yield tx.payment.findUnique({
            where: { id: paymentId },
            include: { booking: true },
        });
        if (!payment)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
        if (payment.status === client_1.PaymentStatus.REJECTED)
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payment already rejected');
        if (payment.status === client_1.PaymentStatus.PAID)
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payment already fully paid');
        const newPaidTotal = +(payment.paidAmount + payload.paidAmount).toFixed(2);
        if (newPaidTotal > payment.totalAmount + 0.0001)
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `paidAmount ${newPaidTotal} exceeds totalAmount ${payment.totalAmount}`);
        const amountDue = +(payment.totalAmount - newPaidTotal).toFixed(2);
        const isPartial = amountDue > 0.0001;
        const newStatus = isPartial ? client_1.PaymentStatus.PARTIALLY_PAID : client_1.PaymentStatus.PAID;
        const updated = yield tx.payment.update({
            where: { id: paymentId },
            data: {
                paidAmount: newPaidTotal,
                status: newStatus,
                adminNote: payload.adminNote,
                approvedAt: new Date(),
                approvedById: payload.adminId,
            },
        });
        const invoiceNo = yield generateInvoiceNo(tx);
        const invoice = yield tx.invoice.create({
            data: {
                invoiceNo,
                paymentId,
                userId: payment.userId,
                totalAmount: payment.totalAmount,
                amountPaid: payload.paidAmount,
                amountDue,
                isPartial,
            },
        });
        if (!isPartial) {
            yield tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CONFIRMED' },
            });
        }
        return { payment: updated, invoice };
    }), { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    // Retry on serialization failure (P2034) or unique invoiceNo race (P2002).
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return yield runOnce();
        }
        catch (e) {
            lastErr = e;
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && (e.code === 'P2002' || e.code === 'P2034')) {
                continue;
            }
            throw e;
        }
    }
    throw lastErr;
});
const rejectPayment = (paymentId, adminNote, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payment.update({
        where: { id: paymentId },
        data: {
            status: client_1.PaymentStatus.REJECTED,
            adminNote,
            approvedAt: new Date(),
            approvedById: adminId,
        },
    });
});
const listAll = (opts) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, status } = opts;
    const where = {};
    if (status)
        where.status = status;
    const [data, total] = yield Promise.all([
        prisma_1.default.payment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                booking: {
                    include: { service: { select: { title: true, amount: true } } },
                },
                paymentMethod: true,
                invoices: { orderBy: { createdAt: 'desc' } },
            },
        }),
        prisma_1.default.payment.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
});
const listMine = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            booking: { include: { service: { select: { title: true, amount: true } } } },
            paymentMethod: true,
            invoices: { orderBy: { createdAt: 'desc' } },
        },
    });
});
const getOne = (id, userId, isAdmin) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield prisma_1.default.payment.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            booking: { include: { service: true } },
            paymentMethod: true,
            invoices: { orderBy: { createdAt: 'desc' } },
        },
    });
    if (!payment)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
    if (!isAdmin && payment.userId !== userId)
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your payment');
    return payment;
});
exports.PaymentService = {
    createBookingWithPayment,
    submitScreenshot,
    approvePayment,
    rejectPayment,
    listAll,
    listMine,
    getOne,
    generateInvoiceNo,
};
