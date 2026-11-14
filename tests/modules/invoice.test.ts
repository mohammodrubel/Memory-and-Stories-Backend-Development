import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '../../src/app/utils/prisma';
import { InvoiceService } from '../../src/app/modules/invoice/invoice.service';

beforeEach(() => {
  (prisma.order.findMany as any).mockResolvedValue([
    {
      id: 'o1',
      createdAt: new Date('2026-04-01'),
      total: 398,
      status: 'PAID',
      user: { id: 'u1', name: 'Alice', email: 'a@x.io' },
      items: [{ quantity: 2, product: { name: 'Frame' } }],
    },
  ]);
  (prisma.booking.findMany as any).mockResolvedValue([
    {
      id: 'b1',
      createdAt: new Date('2026-03-22'),
      status: 'CONFIRMED',
      user: { id: 'u1', name: 'Alice', email: 'a@x.io' },
      service: { title: 'Wedding', amount: 2999 },
    },
  ]);
  (prisma.order.count as any).mockResolvedValue(1);
  (prisma.booking.count as any).mockResolvedValue(1);
});

describe('InvoiceService', () => {
  it('merges orders and bookings into a single sorted invoice list', async () => {
    const result = await InvoiceService.getInvoices({});
    expect(result.data).toHaveLength(2);
    expect(result.data[0].source).toBe('ORDER');
    expect(result.data[1].source).toBe('BOOKING');
    expect(result.meta.total).toBe(2);
  });

  it('formats reference identifiers like INV-YYYY-PREFIX-XXXXXX', async () => {
    const result = await InvoiceService.getInvoices({});
    expect(result.data[0].reference).toMatch(/^INV-\d{4}-(ORD|BKG)-/);
  });

  it('includes a description summarising line items for orders', async () => {
    const result = await InvoiceService.getInvoices({ source: 'ORDER' });
    expect(result.data[0].description).toContain('Frame');
    expect(result.data[0].description).toContain('×2');
  });

  it('source=ORDER excludes bookings entirely', async () => {
    const result = await InvoiceService.getInvoices({ source: 'ORDER' });
    expect(result.data.every((r) => r.source === 'ORDER')).toBe(true);
  });
});
