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
exports.BannerService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const deleteUploadedFile_1 = require("../../utils/deleteUploadedFile");
const createNewBanner = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.banner.create({
        data: payload,
    });
    return result;
});
// GET ALL with search, filter, pagination
const getAllBanner = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    const where = searchTerm ? {
        OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { short_title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
    } : {};
    const [result, total] = yield Promise.all([
        prisma_1.default.banner.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma_1.default.banner.count({ where }),
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
// GET SINGLE
const getSingleBanner = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.banner.findUnique({
        where: { id },
    });
    return result;
});
// UPDATE
const updateBanner = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.banner.findUnique({ where: { id } });
    const result = yield prisma_1.default.banner.update({
        where: { id },
        data: payload,
    });
    // Image was replaced (not just resent unchanged) — drop the orphaned old file.
    if ((existing === null || existing === void 0 ? void 0 : existing.image) &&
        payload.image !== undefined &&
        payload.image !== existing.image) {
        (0, deleteUploadedFile_1.deleteUploadedFileIfLocal)(existing.image);
    }
    return result;
});
// DELETE
const deleteBanner = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.banner.delete({
        where: { id },
    });
    (0, deleteUploadedFile_1.deleteUploadedFileIfLocal)(result.image);
    return result;
});
exports.BannerService = {
    createNewBanner,
    updateBanner,
    getAllBanner,
    getSingleBanner,
    deleteBanner
};
