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
exports.ProductService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createProduct = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.product.create({
        data: {
            name: payload.name,
            price: Number(payload.price),
            image: payload.image,
            description: payload.description,
        },
    });
});
const getAllProducts = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', minPrice, maxPrice, includeArchived = false, } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    const where = includeArchived ? {} : { archived: false };
    if (searchTerm) {
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined)
            where.price.gte = minPrice;
        if (maxPrice !== undefined)
            where.price.lte = maxPrice;
    }
    const [data, total] = yield Promise.all([
        prisma_1.default.product.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma_1.default.product.count({ where }),
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
const getSingleProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.product.findUnique({ where: { id } });
});
const updateProduct = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {};
    if (payload.name !== undefined)
        data.name = payload.name;
    if (payload.price !== undefined)
        data.price = Number(payload.price);
    if (payload.image !== undefined)
        data.image = payload.image;
    if (payload.description !== undefined)
        data.description = payload.description;
    if (payload.archived !== undefined)
        data.archived = payload.archived;
    return prisma_1.default.product.update({ where: { id }, data });
});
// Products referenced by existing orders can't be hard-deleted without breaking
// those order records (OrderItem.productId is a required FK) — archive instead
// so it disappears from the shop while order history stays intact.
const deleteProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.product.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    const orderItemCount = yield prisma_1.default.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
        const archived = yield prisma_1.default.product.update({
            where: { id },
            data: { archived: true },
        });
        return { archived: true, deleted: false, data: archived };
    }
    const deleted = yield prisma_1.default.product.delete({ where: { id } });
    return { archived: false, deleted: true, data: deleted };
});
exports.ProductService = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
