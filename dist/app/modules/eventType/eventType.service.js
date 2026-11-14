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
exports.EventTypeService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const list = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (onlyActive = false) {
    return prisma_1.default.eventType.findMany({
        where: onlyActive ? { active: true } : {},
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
});
const create = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    return prisma_1.default.eventType.create({
        data: {
            name: data.name,
            icon: data.icon || null,
            sortOrder: (_a = data.sortOrder) !== null && _a !== void 0 ? _a : 0,
            active: (_b = data.active) !== null && _b !== void 0 ? _b : true,
        },
    });
});
const update = (id, data) => __awaiter(void 0, void 0, void 0, function* () { return prisma_1.default.eventType.update({ where: { id }, data }); });
// Event types already used on a booking can't be hard-deleted without breaking
// that booking's event rows (BookingEvent.eventTypeId is a required FK) —
// deactivate instead so it drops out of active dropdowns but history stays intact.
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.eventType.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event type not found');
    }
    const usageCount = yield prisma_1.default.bookingEvent.count({ where: { eventTypeId: id } });
    if (usageCount > 0) {
        const deactivated = yield prisma_1.default.eventType.update({
            where: { id },
            data: { active: false },
        });
        return { deactivated: true, deleted: false, data: deactivated };
    }
    const deleted = yield prisma_1.default.eventType.delete({ where: { id } });
    return { deactivated: false, deleted: true, data: deleted };
});
exports.EventTypeService = { list, create, update, remove };
