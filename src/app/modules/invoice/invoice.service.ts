import prisma from '../../utils/prisma';

export interface IInvoiceSearchOptions {
  page?: number;
  limit?: number;
  userId?: string;
  source?: 'ORDER' | 'BOOKING' | 'ALL';
}

export interface IInvoiceRow {
  id: string;
  source: 'ORDER' | 'BOOKING';
  reference: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  customer: { id: string; name: string; email: string } | null;
}

const formatInvoiceId = (source: 'ORDER' | 'BOOKING', date: Date, id: string) => {
  const year = date.getFullYear();
  const prefix = source === 'ORDER' ? 'ORD' : 'BKG';
  return `INV-${year}-${prefix}-${id.slice(0, 6).toUpperCase()}`;
};

const getInvoices = async (options: IInvoiceSearchOptions) => {
  const { page = 1, limit = 10, userId, source = 'ALL' } = options;

  const orderWhere = userId ? { userId } : {};
  const bookingWhere = userId ? { userId } : {};

  const [orders, bookings, orderTotal, bookingTotal] = await Promise.all([
    source !== 'BOOKING'
      ? prisma.order.findMany({
          where: orderWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        })
      : Promise.resolve([]),
    source !== 'ORDER'
      ? prisma.booking.findMany({
          where: bookingWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            service: { select: { title: true, amount: true } },
          },
        })
      : Promise.resolve([]),
    source !== 'BOOKING'
      ? prisma.order.count({ where: orderWhere })
      : Promise.resolve(0),
    source !== 'ORDER'
      ? prisma.booking.count({ where: bookingWhere })
      : Promise.resolve(0),
  ]);

  const orderRows: IInvoiceRow[] = (orders as any[]).map((o) => ({
    id: o.id,
    source: 'ORDER',
    reference: formatInvoiceId('ORDER', o.createdAt, o.id),
    date: o.createdAt.toISOString(),
    description:
      o.items
        ?.map((i: any) => `${i.product?.name ?? 'Item'} ×${i.quantity}`)
        .join(', ') || 'Order',
    amount: Number(o.total),
    status: o.status,
    customer: o.user,
  }));

  const bookingRows: IInvoiceRow[] = (bookings as any[]).map((b) => ({
    id: b.id,
    source: 'BOOKING',
    reference: formatInvoiceId('BOOKING', b.createdAt, b.id),
    date: b.createdAt.toISOString(),
    description: b.service?.title ?? 'Booking',
    amount: Number(b.service?.amount ?? 0),
    status: b.status,
    customer: b.user,
  }));

  const merged = [...orderRows, ...bookingRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const total = orderTotal + bookingTotal;
  const skip = (page - 1) * limit;
  const data = merged.slice(skip, skip + limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const InvoiceService = {
  getInvoices,
};
