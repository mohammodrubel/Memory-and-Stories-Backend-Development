"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const bookingEventSchema = zod_1.default.object({
    packageDayId: zod_1.default.string().nullable().optional(),
    eventTypeId: zod_1.default.string().min(1, 'Event type required'),
    date: zod_1.default.string().min(1, 'Date required'),
    venue: zod_1.default.string().nullable().optional(),
    notes: zod_1.default.string().nullable().optional(),
});
const createBookingSchema = zod_1.default.object({
    body: zod_1.default.object({
        serviceId: zod_1.default.string().min(1, 'Service is required'),
        date: zod_1.default.string().min(1, 'Date is required'),
        userId: zod_1.default.string().optional(),
        customerName: zod_1.default.string().optional(),
        customerEmail: zod_1.default.string().optional(),
        customerPhone: zod_1.default.string().optional(),
        notes: zod_1.default.string().optional(),
        events: zod_1.default.array(bookingEventSchema).optional(),
        couponCode: zod_1.default.string().optional(),
    }),
});
const updateBookingSchema = zod_1.default.object({
    body: zod_1.default.object({
        status: zod_1.default.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
        date: zod_1.default.string().optional(),
    }),
});
exports.BookingValidation = {
    createBookingSchema,
    updateBookingSchema,
};
