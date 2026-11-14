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
exports.OrderService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const createOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, items } = payload;
    if (!(items === null || items === void 0 ? void 0 : items.length)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Order must contain at least one item');
    }
    const productIds = items.map((i) => i.productId);
    const products = yield prisma_1.default.product.findMany({
        where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'One or more products were not found');
    }
    const total = items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product)
            return sum;
        return sum + product.price * item.quantity;
    }, 0);
    return prisma_1.default.order.create({
        data: {
            userId,
            total,
            items: {
                create: items.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return {
                        productId: item.productId,
                        quantity: item.quantity,
                        price: product.price,
                    };
                }),
            },
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
        },
    });
});
const getAllOrders = (options) => __awaiter(void 0, void 0, void 0, function* () {
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
        ];
    }
    const [data, total] = yield Promise.all([
        prisma_1.default.order.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
            },
        }),
        prisma_1.default.order.count({ where }),
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
const getSingleOrder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.order.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
        },
    });
});
const updateOrder = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.order.update({
        where: { id },
        data: { status: payload.status },
        include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
        },
    });
});
const deleteOrder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.order.delete({ where: { id } });
});
exports.OrderService = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrder,
    deleteOrder,
};
