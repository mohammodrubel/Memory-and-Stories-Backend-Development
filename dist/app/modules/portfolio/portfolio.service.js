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
exports.PortfolioService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const include = {
    categories: { include: { category: true } },
};
// Flatten join rows to `categories: [{id, name}]`, sorted by name for stable output.
const shape = (row) => {
    const { categories } = row, rest = __rest(row, ["categories"]);
    return Object.assign(Object.assign({}, rest), { categories: categories
            .map((l) => ({ id: l.category.id, name: l.category.name }))
            .sort((a, b) => a.name.localeCompare(b.name)) });
};
// Primary: admin sort number ascending. Ties: newest first, then id.
const tieBreak = [{ createdAt: 'desc' }, { id: 'asc' }];
const uniq = (ids) => Array.from(new Set(ids));
const assertCategoriesExist = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.portfolioCategory.count({ where: { id: { in: ids } } });
    if (found !== ids.length)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'One or more categories do not exist');
});
const nextSortOrder = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const agg = yield prisma_1.default.portfolio.aggregate({ _max: { sortOrder: true } });
    return ((_b = (_a = agg === null || agg === void 0 ? void 0 : agg._max) === null || _a === void 0 ? void 0 : _a.sortOrder) !== null && _b !== void 0 ? _b : 0) + 1;
});
const createPortfolio = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ids = uniq(payload.categoryIds || []);
    if (!ids.length)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Select at least one category');
    yield assertCategoriesExist(ids);
    const sortOrder = (_a = payload.sortOrder) !== null && _a !== void 0 ? _a : (yield nextSortOrder());
    const row = yield prisma_1.default.portfolio.create({
        data: {
            image: payload.image,
            title: payload.title || undefined,
            description: payload.description || undefined,
            sortOrder,
            categories: { create: ids.map((categoryId) => ({ categoryId })) },
        },
        include,
    });
    return shape(row);
});
const getAllPortfolios = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'sortOrder', sortOrder, categoryId } = options;
    const skip = (page - 1) * limit;
    const where = {};
    if (categoryId)
        where.categories = { some: { categoryId } };
    if (searchTerm) {
        where.OR = [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    // Only whitelisted sort keys; default is the admin-assigned sort number ascending.
    const dir = sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy = sortBy === 'createdAt'
        ? [{ createdAt: sortOrder === 'asc' ? 'asc' : 'desc' }, { id: 'asc' }]
        : [{ sortOrder: dir }, ...tieBreak];
    const [rows, total] = yield Promise.all([
        prisma_1.default.portfolio.findMany({ where, skip, take: limit, orderBy, include }),
        prisma_1.default.portfolio.count({ where }),
    ]);
    return {
        data: rows.map(shape),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
});
const getSinglePortfolio = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.default.portfolio.findUnique({ where: { id }, include });
    return row ? shape(row) : null;
});
const updatePortfolio = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {};
    if (payload.image !== undefined)
        data.image = payload.image;
    if (payload.title !== undefined)
        data.title = payload.title || null;
    if (payload.description !== undefined)
        data.description = payload.description || null;
    if (payload.sortOrder !== undefined)
        data.sortOrder = payload.sortOrder; // never auto-overwritten
    if (payload.categoryIds) {
        const ids = uniq(payload.categoryIds);
        yield assertCategoriesExist(ids);
        data.categories = { deleteMany: {}, create: ids.map((categoryId) => ({ categoryId })) };
    }
    const row = yield prisma_1.default.portfolio.update({ where: { id }, data, include });
    return shape(row);
});
const deletePortfolio = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.portfolio.delete({ where: { id } });
});
exports.PortfolioService = {
    createPortfolio,
    getAllPortfolios,
    getSinglePortfolio,
    updatePortfolio,
    deletePortfolio,
};
