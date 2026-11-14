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
exports.pushBookingToGcal = pushBookingToGcal;
exports.removeBookingFromGcal = removeBookingFromGcal;
exports.listBookingsForRange = listBookingsForRange;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const googleDrive_service_1 = require("../googleDrive/googleDrive.service");
function eventBody(b) {
    var _a, _b, _c, _d;
    const customerName = ((_a = b.user) === null || _a === void 0 ? void 0 : _a.name) || b.customerName || ((_b = b.user) === null || _b === void 0 ? void 0 : _b.email) || 'Customer';
    const customerContact = [b.customerPhone, b.customerEmail || ((_c = b.user) === null || _c === void 0 ? void 0 : _c.email)]
        .filter(Boolean)
        .join(' / ');
    const title = `${((_d = b.service) === null || _d === void 0 ? void 0 : _d.title) || 'Booking'} — ${customerName}`;
    const start = new Date(b.date);
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000); // default 4h block
    const description = [
        `Customer: ${customerName}`,
        customerContact ? `Contact: ${customerContact}` : null,
        b.notes ? `Notes: ${b.notes}` : null,
        `Booking ID: ${b.id}`,
    ]
        .filter(Boolean)
        .join('\n');
    return {
        summary: title,
        description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        reminders: { useDefault: true },
    };
}
function pushBookingToGcal(bookingId) {
    return __awaiter(this, void 0, void 0, function* () {
        const booking = yield prisma_1.default.booking.findUnique({
            where: { id: bookingId },
            include: {
                service: { select: { title: true } },
                user: { select: { name: true, email: true } },
            },
        });
        if (!booking)
            throw new Error('Booking not found');
        const cal = yield (0, googleDrive_service_1.getAuthedCalendarClient)();
        const body = eventBody(booking);
        if (booking.gcalEventId) {
            const r = yield cal.events.update({
                calendarId: 'primary',
                eventId: booking.gcalEventId,
                requestBody: body,
            });
            yield prisma_1.default.booking.update({
                where: { id: bookingId },
                data: { gcalAddedAt: new Date() },
            });
            return { eventId: r.data.id, htmlLink: r.data.htmlLink, updated: true };
        }
        const r = yield cal.events.insert({
            calendarId: 'primary',
            requestBody: body,
        });
        yield prisma_1.default.booking.update({
            where: { id: bookingId },
            data: { gcalEventId: r.data.id || null, gcalAddedAt: new Date() },
        });
        return { eventId: r.data.id, htmlLink: r.data.htmlLink, updated: false };
    });
}
function removeBookingFromGcal(bookingId) {
    return __awaiter(this, void 0, void 0, function* () {
        const booking = yield prisma_1.default.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new Error('Booking not found');
        if (!booking.gcalEventId)
            return { removed: false };
        const cal = yield (0, googleDrive_service_1.getAuthedCalendarClient)();
        try {
            yield cal.events.delete({
                calendarId: 'primary',
                eventId: booking.gcalEventId,
            });
        }
        catch (e) {
            // 410 = already gone, treat as success
            if ((e === null || e === void 0 ? void 0 : e.code) !== 410 && (e === null || e === void 0 ? void 0 : e.code) !== 404)
                throw e;
        }
        yield prisma_1.default.booking.update({
            where: { id: bookingId },
            data: { gcalEventId: null, gcalAddedAt: null },
        });
        return { removed: true };
    });
}
function listBookingsForRange(startISO, endISO) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const start = new Date(startISO);
        const end = new Date(endISO);
        // Match if booking.date in range OR any event date in range
        const bookings = yield prisma_1.default.booking.findMany({
            where: {
                status: { in: ['PENDING', 'CONFIRMED', 'DELIVERED'] },
                // Only bookings where admin approved payment (PARTIALLY_PAID / PAID)
                // AND at least one invoice exists
                payment: {
                    is: {
                        status: { in: ['PARTIALLY_PAID', 'PAID'] },
                        invoices: { some: {} },
                    },
                },
                OR: [
                    { date: { gte: start, lte: end } },
                    { events: { some: { date: { gte: start, lte: end } } } },
                ],
            },
            orderBy: { date: 'asc' },
            select: {
                id: true,
                date: true,
                status: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                notes: true,
                gcalEventId: true,
                gcalAddedAt: true,
                user: { select: { id: true, name: true, email: true } },
                service: { select: { id: true, title: true } },
                events: {
                    select: {
                        id: true,
                        date: true,
                        venue: true,
                        notes: true,
                        eventType: { select: { id: true, name: true } },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        const out = [];
        for (const b of bookings) {
            if (b.events.length > 0) {
                for (const ev of b.events) {
                    out.push(Object.assign(Object.assign({}, b), { date: ev.date, eventId: ev.id, eventName: ((_a = ev.eventType) === null || _a === void 0 ? void 0 : _a.name) || null, venue: ev.venue, eventNotes: ev.notes }));
                }
            }
            else {
                out.push(b);
            }
        }
        return out;
    });
}
