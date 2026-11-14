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
exports.PhotographerService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const list = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (includeArchived = false) {
    return prisma_1.default.photographer.findMany({
        where: includeArchived ? {} : { archived: false },
        orderBy: { name: 'asc' },
    });
});
const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.photographer.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Photographer not found');
    return found;
});
const create = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.photographer.create({
        data: {
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            notes: data.notes || null,
        },
    });
});
const update = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield getById(id);
    return prisma_1.default.photographer.update({ where: { id }, data });
});
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield getById(id);
    const assignmentCount = yield prisma_1.default.bookingAssignment.count({ where: { photographerId: id } });
    if (assignmentCount > 0) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'Photographer has assignments; archive instead of delete');
    }
    yield prisma_1.default.photographer.delete({ where: { id } });
    return { id };
});
exports.PhotographerService = { list, getById, create, update, remove };
