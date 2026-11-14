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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountService = exports.resolveAutoSaleForService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const discount_calc_1 = require("./discount.calc");
const linkServices = (serviceIds) => serviceIds && serviceIds.length
    ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
    : undefined;
const createDiscount = (payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceIds, code } = payload, rest = __rest(payload, ["serviceIds", "code"]);
    return prisma_1.default.discount.create({
        data: Object.assign(Object.assign({}, rest), { code: code ? String(code).toUpperCase() : null, createdById: adminId, services: linkServices(serviceIds) }),
        include: { services: true },
    });
});
const listDiscounts = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const { kind, active, search, page = 1, limit = 20 } = filters;
    const where = {};
    if (kind)
        where.kind = kind;
    if (typeof active === 'boolean')
        where.active = active;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search.toUpperCase() } },
        ];
    }
    const [items, total] = yield Promise.all([
        prisma_1.default.discount.findMany({
            where,
            include: { services: true, _count: { select: { redemptions: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.default.discount.count({ where }),
    ]);
    return { items, meta: { page, limit, total } };
});
const getDiscount = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const d = yield prisma_1.default.discount.findUnique({
        where: { id },
        include: { services: true, _count: { select: { redemptions: true } } },
    });
    if (!d)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Discount not found');
    return d;
});
const updateDiscount = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceIds, code } = payload, rest = __rest(payload, ["serviceIds", "code"]);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const existing = yield tx.discount.findUnique({ where: { id } });
        if (!existing)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Discount not found');
        if (serviceIds) {
            yield tx.discountService.deleteMany({ where: { discountId: id } });
            if (serviceIds.length) {
                yield tx.discountService.createMany({
                    data: serviceIds.map((serviceId) => ({ discountId: id, serviceId })),
                });
            }
        }
        return tx.discount.update({
            where: { id },
            data: Object.assign(Object.assign({}, rest), { code: code === undefined ? undefined : code ? String(code).toUpperCase() : null }),
            include: { services: true },
        });
    }));
});
const softDeleteDiscount = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.discount.update({ where: { id }, data: { active: false } });
});
const validateCoupon = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const code = input.code.toUpperCase();
    const now = new Date();
    const discount = yield prisma_1.default.discount.findFirst({
        where: {
            code,
            kind: 'COUPON',
            active: true,
            validFrom: { lte: now },
            validTo: { gte: now },
        },
        include: { services: true },
    });
    if (!discount) {
        return { valid: false, reason: 'Invalid or expired coupon' };
    }
    if (discount.services.length > 0 && !discount.services.some((s) => s.serviceId === input.serviceId)) {
        return { valid: false, reason: 'Coupon not valid for this service' };
    }
    if (discount.usageCap != null && discount.usageCount >= discount.usageCap) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    if (input.userId && discount.perCustomerLimit != null) {
        const used = yield prisma_1.default.bookingDiscount.count({
            where: { discountId: discount.id, booking: { userId: input.userId } },
        });
        if (used >= discount.perCustomerLimit) {
            return { valid: false, reason: 'You already used this coupon' };
        }
    }
    const service = yield prisma_1.default.service.findUnique({ where: { id: input.serviceId }, select: { amount: true } });
    if (!service)
        return { valid: false, reason: 'Service not found' };
    if (discount.minBookingAmount != null && service.amount < discount.minBookingAmount) {
        return {
            valid: false,
            reason: `Minimum booking amount ${discount.minBookingAmount} not met`,
        };
    }
    const amount = (0, discount_calc_1.computeDiscountAmount)({
        subtotal: service.amount,
        type: discount.type,
        value: discount.value,
        maxDiscountAmount: discount.maxDiscountAmount,
    });
    return {
        valid: true,
        discountId: discount.id,
        type: discount.type,
        value: discount.value,
        amount,
    };
});
const resolveAutoSale = (tx, serviceId, subtotal, now) => __awaiter(void 0, void 0, void 0, function* () {
    const candidates = yield tx.discount.findMany({
        where: {
            kind: 'AUTO_SALE',
            active: true,
            validFrom: { lte: now },
            validTo: { gte: now },
            OR: [{ services: { none: {} } }, { services: { some: { serviceId } } }],
        },
    });
    if (!candidates.length)
        return null;
    // Filter out candidates that have hit their usageCap
    const eligible = candidates.filter((d) => d.usageCap == null || d.usageCount < d.usageCap);
    if (!eligible.length)
        return null;
    const scored = eligible
        .map((d) => ({
        discount: d,
        amount: (0, discount_calc_1.computeDiscountAmount)({
            subtotal,
            type: d.type,
            value: d.value,
            maxDiscountAmount: d.maxDiscountAmount,
        }),
    }))
        .sort((a, b) => b.amount - a.amount);
    const winner = scored[0];
    if (winner.amount <= 0)
        return null;
    return winner;
});
const applyAtBookingCreation = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { tx, bookingId, serviceId, subtotal, userId, couponCode, adminId } = input;
    const now = new Date();
    const autoSale = yield resolveAutoSale(tx, serviceId, subtotal, now);
    let couponCandidate = null;
    if (couponCode) {
        const code = couponCode.toUpperCase();
        const d = yield tx.discount.findFirst({
            where: {
                code,
                kind: 'COUPON',
                active: true,
                validFrom: { lte: now },
                validTo: { gte: now },
            },
            include: { services: true },
        });
        if (d) {
            const serviceOk = d.services.length === 0 || d.services.some((s) => s.serviceId === serviceId);
            const capOk = d.usageCap == null || d.usageCount < d.usageCap;
            const minOk = d.minBookingAmount == null || subtotal >= d.minBookingAmount;
            const perCustOk = d.perCustomerLimit == null ||
                (yield tx.bookingDiscount.count({ where: { discountId: d.id, booking: { userId } } })) <
                    d.perCustomerLimit;
            if (serviceOk && capOk && minOk && perCustOk) {
                const amount = (0, discount_calc_1.computeDiscountAmount)({
                    subtotal,
                    type: d.type,
                    value: d.value,
                    maxDiscountAmount: d.maxDiscountAmount,
                });
                if (amount > 0)
                    couponCandidate = { discount: d, amount };
            }
        }
    }
    const winner = autoSale && couponCandidate
        ? autoSale.amount >= couponCandidate.amount
            ? Object.assign(Object.assign({}, autoSale), { source: 'AUTO_SALE' }) : Object.assign(Object.assign({}, couponCandidate), { source: 'COUPON' })
        : autoSale
            ? Object.assign(Object.assign({}, autoSale), { source: 'AUTO_SALE' }) : couponCandidate
            ? Object.assign(Object.assign({}, couponCandidate), { source: 'COUPON' }) : null;
    if (!winner)
        return { discountAmount: 0, applied: null };
    // Re-read inside transaction to guard against concurrent cap exhaustion
    const fresh = yield tx.discount.findUnique({ where: { id: winner.discount.id } });
    if (fresh == null || (fresh.usageCap != null && fresh.usageCount >= fresh.usageCap)) {
        return { discountAmount: 0, applied: null };
    }
    const row = yield tx.bookingDiscount.create({
        data: {
            bookingId,
            discountId: winner.discount.id,
            source: winner.source,
            type: winner.discount.type,
            value: winner.discount.value,
            amount: winner.amount,
            appliedById: adminId,
        },
    });
    yield tx.discount.update({
        where: { id: winner.discount.id },
        data: { usageCount: { increment: 1 } },
    });
    return { discountAmount: winner.amount, applied: row };
});
/**
 * Resolves the best AUTO_SALE discount for a given service and subtotal without a
 * transaction client (uses the global prisma instance). Suitable for read-only
 * display use-cases such as the service list endpoint.
 */
const resolveAutoSaleForService = (serviceId, subtotal) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const candidates = yield prisma_1.default.discount.findMany({
        where: {
            kind: 'AUTO_SALE',
            active: true,
            validFrom: { lte: now },
            validTo: { gte: now },
            OR: [{ services: { none: {} } }, { services: { some: { serviceId } } }],
        },
    });
    if (!candidates.length)
        return null;
    const eligible = candidates.filter((d) => d.usageCap == null || d.usageCount < d.usageCap);
    if (!eligible.length)
        return null;
    const scored = eligible
        .map((d) => ({
        discount: d,
        amount: (0, discount_calc_1.computeDiscountAmount)({
            subtotal,
            type: d.type,
            value: d.value,
            maxDiscountAmount: d.maxDiscountAmount,
        }),
    }))
        .sort((a, b) => b.amount - a.amount);
    const winner = scored[0];
    if (winner.amount <= 0)
        return null;
    return {
        discountId: winner.discount.id,
        type: winner.discount.type,
        value: winner.discount.value,
        amount: winner.amount,
    };
});
exports.resolveAutoSaleForService = resolveAutoSaleForService;
exports.DiscountService = {
    createDiscount,
    listDiscounts,
    getDiscount,
    updateDiscount,
    softDeleteDiscount,
    validateCoupon,
    applyAtBookingCreation,
};
