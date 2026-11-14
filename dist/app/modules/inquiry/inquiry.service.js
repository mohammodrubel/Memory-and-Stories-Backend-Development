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
exports.InquiryService = void 0;
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const createInquiry = (p) => __awaiter(void 0, void 0, void 0, function* () {
    let eventDate;
    if (p.eventDate) {
        eventDate = new Date(p.eventDate);
        if (Number.isNaN(eventDate.getTime()))
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid event date');
    }
    const row = yield prisma_1.default.inquiry.create({
        data: {
            name: p.name,
            email: p.email,
            phone: p.phone,
            service: p.service || undefined,
            eventDate,
            message: p.message,
        },
    });
    return { id: row.id };
});
const getAllInquiries = (opts) => __awaiter(void 0, void 0, void 0, function* () {
    const page = opts.page || 1;
    const limit = Math.min(opts.limit || 20, 100);
    const where = opts.status && opts.status in client_1.InquiryStatus ? { status: opts.status } : {};
    const [data, total] = yield Promise.all([
        prisma_1.default.inquiry.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        }),
        prisma_1.default.inquiry.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
});
const updateStatus = (id, status) => prisma_1.default.inquiry.update({ where: { id }, data: { status } });
const deleteInquiry = (id) => prisma_1.default.inquiry.delete({ where: { id } });
exports.InquiryService = { createInquiry, getAllInquiries, updateStatus, deleteInquiry };
