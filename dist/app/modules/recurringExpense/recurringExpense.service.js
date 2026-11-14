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
exports.RecurringExpenseService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const list = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (includeInactive = false) {
    return prisma_1.default.recurringExpense.findMany({
        where: includeInactive ? {} : { active: true },
        include: { category: true, staff: true },
        orderBy: { label: 'asc' },
    });
});
const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.recurringExpense.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Recurring expense not found');
    return found;
});
const create = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.recurringExpense.create({ data: data });
});
const update = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield getById(id);
    return prisma_1.default.recurringExpense.update({ where: { id }, data });
});
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield getById(id);
    yield prisma_1.default.recurringExpense.delete({ where: { id } });
    return { id };
});
exports.RecurringExpenseService = { list, getById, create, update, remove };
