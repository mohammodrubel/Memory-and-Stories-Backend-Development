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
exports.PrintRequestService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../utils/prisma"));
const notification_service_1 = require("../notification/notification.service");
const EDITABLE = [
    client_1.PrintStatus.DRAFT,
    client_1.PrintStatus.CHANGES_REQUESTED,
];
function getOrCreateDraft(userId, bookingId) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield prisma_1.default.printRequest.findFirst({
            where: { bookingId, userId, status: { in: EDITABLE } },
            include: { selections: true },
        });
        if (existing)
            return existing;
        const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
        if (!booking)
            throw new Error('Booking not found');
        if (booking.userId !== userId)
            throw new Error('Not your booking');
        if (!booking.deliveryFolderId)
            throw new Error('Booking not delivered');
        if (!booking.printLimit || booking.printLimit <= 0) {
            throw new Error('Print not enabled for this booking');
        }
        return prisma_1.default.printRequest.create({
            data: {
                bookingId,
                userId,
                maxPhotos: booking.printLimit,
                status: client_1.PrintStatus.DRAFT,
            },
            include: { selections: true },
        });
    });
}
function listForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.printRequest.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                selections: true,
                booking: { select: { id: true, deliveryFolderName: true } },
            },
        });
    });
}
function listAll() {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.printRequest.findMany({
            where: { status: { not: client_1.PrintStatus.DRAFT } },
            orderBy: { updatedAt: 'desc' },
            include: {
                selections: true,
                booking: {
                    select: {
                        id: true,
                        deliveryFolderName: true,
                        service: { select: { title: true } },
                    },
                },
                user: { select: { id: true, name: true, email: true } },
            },
        });
    });
}
function getOne(id, userId, isAdmin) {
    return __awaiter(this, void 0, void 0, function* () {
        const r = yield prisma_1.default.printRequest.findUnique({
            where: { id },
            include: {
                selections: true,
                booking: { select: { id: true, deliveryFolderName: true, deliveryFolderId: true, service: { select: { title: true } } } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        if (!r)
            return null;
        if (!isAdmin && r.userId !== userId)
            return null;
        return r;
    });
}
function updateSelections(id, userId, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const req = yield prisma_1.default.printRequest.findUnique({
            where: { id },
            include: { booking: true, selections: true },
        });
        if (!req)
            throw new Error('Print request not found');
        if (req.userId !== userId)
            throw new Error('Not your request');
        if (!EDITABLE.includes(req.status))
            throw new Error('Request locked');
        if (!req.booking.deliveryFolderId)
            throw new Error('Booking not delivered');
        if ((_a = payload.remove) === null || _a === void 0 ? void 0 : _a.length) {
            yield prisma_1.default.printSelection.deleteMany({
                where: { printRequestId: id, fileId: { in: payload.remove } },
            });
        }
        if ((_b = payload.add) === null || _b === void 0 ? void 0 : _b.length) {
            // Validate from DeliveryFile snapshot (no Drive API call)
            const fileIds = payload.add.map((a) => a.fileId);
            const rows = yield prisma_1.default.deliveryFile.findMany({
                where: { bookingId: req.bookingId, fileId: { in: fileIds } },
            });
            const rowMap = new Map(rows.map((r) => [r.fileId, r]));
            const enriched = [];
            for (const item of payload.add) {
                const r = rowMap.get(item.fileId);
                if (!r)
                    throw new Error(`File ${item.fileId} not in delivery tree`);
                if (r.isFolder || !r.mimeType.startsWith('image/')) {
                    throw new Error(`File ${item.fileId} not an image`);
                }
                enriched.push({
                    fileId: r.fileId,
                    fileName: r.fileName,
                    parentFolderId: r.parentFolderId,
                    parentFolderName: r.parentFolderName,
                });
            }
            const current = yield prisma_1.default.printSelection.count({
                where: { printRequestId: id },
            });
            const wouldBe = current + payload.add.length - (((_c = payload.remove) === null || _c === void 0 ? void 0 : _c.length) || 0);
            if (wouldBe > req.maxPhotos) {
                throw new Error(`Exceeds limit of ${req.maxPhotos} photos`);
            }
            yield prisma_1.default.printSelection.createMany({
                data: enriched.map((a) => (Object.assign({ printRequestId: id }, a))),
                skipDuplicates: true,
            });
        }
        return prisma_1.default.printRequest.findUnique({
            where: { id },
            include: { selections: true },
        });
    });
}
function submit(id, userId, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const req = yield prisma_1.default.printRequest.findUnique({
            where: { id },
            include: { selections: true, user: true },
        });
        if (!req)
            throw new Error('Print request not found');
        if (req.userId !== userId)
            throw new Error('Not your request');
        if (!EDITABLE.includes(req.status))
            throw new Error('Already submitted');
        if (req.selections.length === 0)
            throw new Error('Select at least one photo');
        const ok = yield bcrypt_1.default.compare(password, req.user.password);
        if (!ok)
            throw new Error('Wrong password');
        const updated = yield prisma_1.default.printRequest.update({
            where: { id },
            data: {
                status: client_1.PrintStatus.SUBMITTED,
                submittedAt: new Date(),
                adminNote: null,
            },
            include: { booking: { select: { service: { select: { title: true } } } } },
        });
        // Notify all admins
        const admins = yield prisma_1.default.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true },
        });
        for (const a of admins) {
            yield (0, notification_service_1.createNotification)({
                userId: a.id,
                type: 'print.requested',
                title: `New print request from ${req.user.name}`,
                body: `${req.selections.length} photo(s) for ${((_a = updated.booking.service) === null || _a === void 0 ? void 0 : _a.title) || 'booking'}`,
                data: {
                    printRequestId: id,
                    link: `/dashboard/admin/print-requests/${id}`,
                },
            });
        }
        return updated;
    });
}
function adminAction(id, action, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = yield prisma_1.default.printRequest.findUnique({ where: { id } });
        if (!req)
            throw new Error('Not found');
        let nextStatus = null;
        const data = {};
        let title = '';
        let body = '';
        if (action === 'request-changes') {
            if (req.status !== client_1.PrintStatus.SUBMITTED) {
                throw new Error('Only SUBMITTED can be sent back');
            }
            nextStatus = client_1.PrintStatus.CHANGES_REQUESTED;
            data.adminNote = (payload === null || payload === void 0 ? void 0 : payload.note) || null;
            title = 'Admin requested changes to your print selection';
            body = (payload === null || payload === void 0 ? void 0 : payload.note) || 'Please review and resubmit.';
        }
        else if (action === 'approve') {
            if (req.status !== client_1.PrintStatus.SUBMITTED) {
                throw new Error('Only SUBMITTED can be approved');
            }
            nextStatus = client_1.PrintStatus.APPROVED;
            data.approvedAt = new Date();
            title = 'Your print request was approved';
            body = 'We will start printing soon.';
        }
        else if (action === 'start-printing') {
            if (req.status !== client_1.PrintStatus.APPROVED) {
                throw new Error('Must be APPROVED first');
            }
            nextStatus = client_1.PrintStatus.PRINTING;
            data.printingAt = new Date();
            title = 'Your prints are now being printed';
            body = '';
        }
        else if (action === 'deliver') {
            if (req.status !== client_1.PrintStatus.PRINTING) {
                throw new Error('Must be PRINTING first');
            }
            nextStatus = client_1.PrintStatus.DELIVERED;
            data.printDeliveredAt = new Date();
            title = 'Your prints have been delivered';
            body = '';
        }
        else if (action === 'reject') {
            if (req.status !== client_1.PrintStatus.SUBMITTED &&
                req.status !== client_1.PrintStatus.CHANGES_REQUESTED) {
                throw new Error('Cannot reject at this stage');
            }
            nextStatus = client_1.PrintStatus.REJECTED;
            data.rejectionReason = (payload === null || payload === void 0 ? void 0 : payload.reason) || 'No reason given';
            title = 'Your print request was rejected';
            body = data.rejectionReason;
        }
        if (!nextStatus)
            throw new Error('Bad action');
        data.status = nextStatus;
        const updated = yield prisma_1.default.printRequest.update({
            where: { id },
            data,
        });
        yield (0, notification_service_1.createNotification)({
            userId: req.userId,
            type: `print.${action}`,
            title,
            body,
            data: {
                printRequestId: id,
                link: `/dashboard/user/prints/${id}`,
            },
        });
        return updated;
    });
}
exports.PrintRequestService = {
    getOrCreateDraft,
    listForUser,
    listAll,
    getOne,
    updateSelections,
    submit,
    adminAction,
};
