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
exports.BookingFinanceService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const ensureBookingAccess = (bookingId, userId, isAdmin) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    if (!isAdmin && booking.userId !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your booking');
    }
    return booking;
});
const listAssignments = (bookingId, userId, isAdmin) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureBookingAccess(bookingId, userId, isAdmin);
    const rows = yield prisma_1.default.bookingAssignment.findMany({
        where: { bookingId },
        include: { photographer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
    });
    if (isAdmin)
        return rows;
    return rows.map((r) => ({
        id: r.id,
        photographerId: r.photographerId,
        photographer: r.photographer,
    }));
});
const createAssignment = (bookingId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    const photographer = yield prisma_1.default.photographer.findUnique({
        where: { id: data.photographerId },
    });
    if (!photographer)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Photographer not found');
    try {
        return yield prisma_1.default.bookingAssignment.create({
            data: {
                bookingId,
                photographerId: data.photographerId,
                fee: data.fee,
            },
            include: { photographer: { select: { id: true, name: true } } },
        });
    }
    catch (err) {
        const code = err.code;
        if (code === 'P2002') {
            throw new AppError_1.default(http_status_1.default.CONFLICT, 'Photographer already assigned to booking');
        }
        throw err;
    }
});
const updateAssignment = (bookingId, id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.default.bookingAssignment.findUnique({ where: { id } });
    if (!row || row.bookingId !== bookingId) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Assignment not found');
    }
    return prisma_1.default.bookingAssignment.update({
        where: { id },
        data,
        include: { photographer: { select: { id: true, name: true } } },
    });
});
const deleteAssignment = (bookingId, id) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.default.bookingAssignment.findUnique({ where: { id } });
    if (!row || row.bookingId !== bookingId) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Assignment not found');
    }
    yield prisma_1.default.bookingAssignment.delete({ where: { id } });
    return { id };
});
const listExpenses = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    return prisma_1.default.bookingExpense.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'asc' },
    });
});
const createExpense = (bookingId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    return prisma_1.default.bookingExpense.create({
        data: { bookingId, label: data.label, amount: data.amount },
    });
});
const updateExpense = (bookingId, id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.default.bookingExpense.findUnique({ where: { id } });
    if (!row || row.bookingId !== bookingId) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Expense not found');
    }
    return prisma_1.default.bookingExpense.update({ where: { id }, data });
});
const deleteExpense = (bookingId, id) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.default.bookingExpense.findUnique({ where: { id } });
    if (!row || row.bookingId !== bookingId) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Expense not found');
    }
    yield prisma_1.default.bookingExpense.delete({ where: { id } });
    return { id };
});
const profit = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.booking.findUnique({
        where: { id: bookingId },
        include: {
            payment: true,
            assignments: true,
            bookingExpenses: true,
        },
    });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    const booked = booking.totalAmount || 0;
    const collected = booking.payment && (booking.payment.status === 'PAID' || booking.payment.status === 'PARTIALLY_PAID')
        ? booking.payment.paidAmount || 0
        : 0;
    const assignmentFees = booking.assignments.reduce((s, a) => s + (a.fee || 0), 0);
    const bookingExpenses = booking.bookingExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalCost = assignmentFees + bookingExpenses;
    const profitIfFullyPaid = booked - totalCost;
    const profitCash = collected - totalCost;
    return {
        booked,
        collected,
        assignmentFees,
        bookingExpenses,
        totalCost,
        profitIfFullyPaid,
        profitCash,
    };
});
exports.BookingFinanceService = {
    listAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    listExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    profit,
};
