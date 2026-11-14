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
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
// GET ALL with search, filter, pagination
const GetAllUsers = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', role } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    const where = {};
    if (role) {
        where.role = role;
    }
    if (searchTerm) {
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    const [result, total] = yield Promise.all([
        prisma_1.default.user.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                whatsapp: true,
                role: true,
                createdAt: true,
            },
        }),
        prisma_1.default.user.count({ where }),
    ]);
    return {
        data: result,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const GetSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.user.findUnique({
        where: {
            id: id,
        },
    });
    return result;
});
const GetProfile = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.user.findUnique({
        where: {
            id: id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
    return result;
});
const UpdateProfile = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.user.update({
        where: {
            id: id,
        },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
    return result;
});
const DeleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.user.delete({
        where: {
            id: id,
        },
    });
});
const SetUserRole = (id, role) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.user.update({
        where: { id },
        data: { role: role },
        select: { id: true, name: true, email: true, role: true },
    });
});
const ExportUsers = (role) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {};
    if (role)
        where.role = role;
    return prisma_1.default.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            role: true,
            createdAt: true,
        },
    });
});
exports.UserService = {
    GetAllUsers,
    GetSingleUser,
    GetProfile,
    UpdateProfile,
    DeleteUser,
    ExportUsers,
    SetUserRole,
};
