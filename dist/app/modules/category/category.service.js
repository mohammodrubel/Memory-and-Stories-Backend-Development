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
exports.CategoryService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const createCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.category.create({ data: { name: payload.name } });
});
const getAllCategories = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    const where = searchTerm
        ? {
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
        }
        : {};
    const [data, total] = yield Promise.all([
        prisma_1.default.category.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            include: { _count: { select: { portfolios: true } } },
        }),
        prisma_1.default.category.count({ where }),
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
const getSingleCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.category.findUnique({
        where: { id },
        include: { portfolios: true },
    });
});
const updateCategory = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.category.update({
        where: { id },
        data: { name: payload.name },
    });
});
const deleteCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.category.delete({ where: { id } });
});
exports.CategoryService = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
