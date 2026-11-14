"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const createPaymentMethod = (data) => prisma_1.default.paymentMethod.create({ data });
const updatePaymentMethod = (id, data) => prisma_1.default.paymentMethod.update({ where: { id }, data });
const deletePaymentMethod = (id) => prisma_1.default.paymentMethod.delete({ where: { id } });
const getActivePaymentMethods = () => prisma_1.default.paymentMethod.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
});
const getAllPaymentMethods = (opts = {}) => {
    const where = {};
    if (!opts.includeInactive)
        where.active = true;
    return prisma_1.default.paymentMethod.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
};
const getSinglePaymentMethod = (id) => prisma_1.default.paymentMethod.findUnique({ where: { id } });
exports.PaymentMethodService = {
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getActivePaymentMethods,
    getAllPaymentMethods,
    getSinglePaymentMethod,
};
