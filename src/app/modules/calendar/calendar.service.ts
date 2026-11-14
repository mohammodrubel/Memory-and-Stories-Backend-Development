import prisma from '../../utils/prisma';
import { getAuthedCalendarClient } from '../googleDrive/googleDrive.service';

type BookingForGcal = {
  id: string;
  date: Date;
  service?: { title?: string | null } | null;
  user?: { name?: string | null; email?: string | null } | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
};

function eventBody(b: BookingForGcal) {
  const customerName =
    b.user?.name || b.customerName || b.user?.email || 'Customer';
  const customerContact = [b.customerPhone, b.customerEmail || b.user?.email]
    .filter(Boolean)
    .join(' / ');
  const title = `${b.service?.title || 'Booking'} — ${customerName}`;
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

export async function pushBookingToGcal(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { title: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!booking) throw new Error('Booking not found');
  const cal = await getAuthedCalendarClient();
  const body = eventBody(booking as BookingForGcal);
  if (booking.gcalEventId) {
    const r = await cal.events.update({
      calendarId: 'primary',
      eventId: booking.gcalEventId,
      requestBody: body,
    });
    await prisma.booking.update({
      where: { id: bookingId },
      data: { gcalAddedAt: new Date() },
    });
    return { eventId: r.data.id, htmlLink: r.data.htmlLink, updated: true };
  }
  const r = await cal.events.insert({
    calendarId: 'primary',
    requestBody: body,
  });
  await prisma.booking.update({
    where: { id: bookingId },
    data: { gcalEventId: r.data.id || null, gcalAddedAt: new Date() },
  });
  return { eventId: r.data.id, htmlLink: r.data.htmlLink, updated: false };
}

export async function removeBookingFromGcal(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new Error('Booking not found');
  if (!booking.gcalEventId) return { removed: false };
  const cal = await getAuthedCalendarClient();
  try {
    await cal.events.delete({
      calendarId: 'primary',
      eventId: booking.gcalEventId,
    });
  } catch (e: any) {
    // 410 = already gone, treat as success
    if (e?.code !== 410 && e?.code !== 404) throw e;
  }
  await prisma.booking.update({
    where: { id: bookingId },
    data: { gcalEventId: null, gcalAddedAt: null },
  });
  return { removed: true };
}

export async function listBookingsForRange(
  startISO: string,
  endISO: string,
) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  // Match if booking.date in range OR any event date in range
  const bookings = await prisma.booking.findMany({
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

  // Flatten: if booking has events, emit one entry per event w/ that event's date
  type CalEntry = (typeof bookings)[number] & {
    eventId?: string | null;
    eventName?: string | null;
    venue?: string | null;
    eventNotes?: string | null;
  };
  const out: CalEntry[] = [];
  for (const b of bookings) {
    if (b.events.length > 0) {
      for (const ev of b.events) {
        out.push({
          ...b,
          date: ev.date,
          eventId: ev.id,
          eventName: ev.eventType?.name || null,
          venue: ev.venue,
          eventNotes: ev.notes,
        });
      }
    } else {
      out.push(b);
    }
  }
  return out;
}
