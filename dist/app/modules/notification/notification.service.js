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
exports.createNotification = createNotification;
exports.listForUser = listForUser;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const notifier_1 = require("../../utils/notifier");
function createNotification(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield prisma_1.default.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                title: input.title,
                body: input.body || null,
                data: input.data || {},
            },
        });
        (0, notifier_1.emit)(input.userId, 'notification', row);
        return row;
    });
}
function listForUser(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, opts = {}) {
        const limit = Math.min(opts.limit || 30, 100);
        const where = { userId };
        if (opts.unread)
            where.readAt = null;
        const [items, unreadCount] = yield Promise.all([
            prisma_1.default.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma_1.default.notification.count({ where: { userId, readAt: null } }),
        ]);
        return { items, unreadCount };
    });
}
function markRead(userId, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const n = yield prisma_1.default.notification.findUnique({ where: { id } });
        if (!n || n.userId !== userId)
            return null;
        if (n.readAt)
            return n;
        return prisma_1.default.notification.update({
            where: { id },
            data: { readAt: new Date() },
        });
    });
}
function markAllRead(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const r = yield prisma_1.default.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
        return { updated: r.count };
    });
}
