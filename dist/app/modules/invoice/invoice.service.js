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
exports.InvoiceService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const formatInvoiceId = (source, date, id) => {
    const year = date.getFullYear();
    const prefix = source === 'ORDER' ? 'ORD' : 'BKG';
    return `INV-${year}-${prefix}-${id.slice(0, 6).toUpperCase()}`;
};
const getInvoices = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, userId, source = 'ALL' } = options;
    const orderWhere = userId ? { userId } : {};
    const bookingWhere = userId ? { userId } : {};
    const [orders, bookings, orderTotal, bookingTotal] = yield Promise.all([
        source !== 'BOOKING'
            ? prisma_1.default.order.findMany({
                where: orderWhere,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: { include: { product: { select: { name: true } } } },
                },
            })
            : Promise.resolve([]),
        source !== 'ORDER'
            ? prisma_1.default.booking.findMany({
                where: bookingWhere,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    service: { select: { title: true, amount: true } },
                },
            })
            : Promise.resolve([]),
        source !== 'BOOKING'
            ? prisma_1.default.order.count({ where: orderWhere })
            : Promise.resolve(0),
        source !== 'ORDER'
            ? prisma_1.default.booking.count({ where: bookingWhere })
            : Promise.resolve(0),
    ]);
    const orderRows = orders.map((o) => {
        var _a;
        return ({
            id: o.id,
            source: 'ORDER',
            reference: formatInvoiceId('ORDER', o.createdAt, o.id),
            date: o.createdAt.toISOString(),
            description: ((_a = o.items) === null || _a === void 0 ? void 0 : _a.map((i) => { var _a, _b; return `${(_b = (_a = i.product) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Item'} ×${i.quantity}`; }).join(', ')) || 'Order',
            amount: Number(o.total),
            status: o.status,
            customer: o.user,
        });
    });
    const bookingRows = bookings.map((b) => {
        var _a, _b, _c, _d;
        return ({
            id: b.id,
            source: 'BOOKING',
            reference: formatInvoiceId('BOOKING', b.createdAt, b.id),
            date: b.createdAt.toISOString(),
            description: (_b = (_a = b.service) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : 'Booking',
            amount: Number((_d = (_c = b.service) === null || _c === void 0 ? void 0 : _c.amount) !== null && _d !== void 0 ? _d : 0),
            status: b.status,
            customer: b.user,
        });
    });
    const merged = [...orderRows, ...bookingRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = orderTotal + bookingTotal;
    const skip = (page - 1) * limit;
    const data = merged.slice(skip, skip + limit);
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
exports.InvoiceService = {
    getInvoices,
};
