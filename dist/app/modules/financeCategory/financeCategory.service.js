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
exports.FinanceCategoryService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const DEFAULT_EXPENSE = [
    'Rent',
    'Utility',
    'Salary',
    'Internet',
    'Equipment',
    'Marketing',
    'Transport',
    'Other',
];
const DEFAULT_INCOME = ['Booking', 'Print Sales', 'Equipment Rental', 'Other'];
const seedIfEmpty = () => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield prisma_1.default.financeCategory.count();
    if (count > 0)
        return;
    yield prisma_1.default.financeCategory.createMany({
        data: [
            ...DEFAULT_EXPENSE.map((name) => ({ name, type: 'EXPENSE' })),
            ...DEFAULT_INCOME.map((name) => ({ name, type: 'INCOME' })),
        ],
        skipDuplicates: true,
    });
});
const list = (type_1, ...args_1) => __awaiter(void 0, [type_1, ...args_1], void 0, function* (type, includeArchived = false) {
    yield seedIfEmpty();
    return prisma_1.default.financeCategory.findMany({
        where: Object.assign(Object.assign({}, (type ? { type } : {})), (includeArchived ? {} : { archived: false })),
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
});
const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.financeCategory.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found');
    return found;
});
const create = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prisma_1.default.financeCategory.create({ data });
    }
    catch (err) {
        const code = err.code;
        if (code === 'P2002') {
            throw new AppError_1.default(http_status_1.default.CONFLICT, 'Category name already exists for that type');
        }
        throw err;
    }
});
const update = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield getById(id);
    return prisma_1.default.financeCategory.update({ where: { id }, data });
});
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield getById(id);
    const counts = yield Promise.all([
        prisma_1.default.expense.count({ where: { categoryId: id } }),
        prisma_1.default.income.count({ where: { categoryId: id } }),
        prisma_1.default.recurringExpense.count({ where: { categoryId: id } }),
    ]);
    if (counts.reduce((a, b) => a + b, 0) > 0) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'Category in use; archive instead');
    }
    yield prisma_1.default.financeCategory.delete({ where: { id } });
    return { id };
});
exports.FinanceCategoryService = { list, getById, create, update, remove, seedIfEmpty };
