import { describe, it, expect } from 'vitest';
import prisma from '../../src/app/utils/prisma';
import { BookingFinanceService } from '../../src/app/modules/bookingFinance/bookingFinance.service';

describe('BookingFinanceService.profit', () => {
  it('calculates profit with PAID payment (collected == booked)', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1',
      totalAmount: 50000,
      payment: { status: 'PAID', paidAmount: 50000 },
      assignments: [{ fee: 6000 }, { fee: 4000 }],
      bookingExpenses: [{ amount: 3000 }, { amount: 2000 }],
    });
    const p = await BookingFinanceService.profit('b1');
    expect(p.booked).toBe(50000);
    expect(p.collected).toBe(50000);
    expect(p.assignmentFees).toBe(10000);
    expect(p.bookingExpenses).toBe(5000);
    expect(p.totalCost).toBe(15000);
    expect(p.profitIfFullyPaid).toBe(35000);
    expect(p.profitCash).toBe(35000);
  });

  it('PARTIALLY_PAID booking: collected uses paidAmount, profit split', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1',
      totalAmount: 50000,
      payment: { status: 'PARTIALLY_PAID', paidAmount: 20000 },
      assignments: [{ fee: 10000 }],
      bookingExpenses: [{ amount: 5000 }],
    });
    const p = await BookingFinanceService.profit('b1');
    expect(p.collected).toBe(20000);
    expect(p.profitIfFullyPaid).toBe(35000);
    expect(p.profitCash).toBe(5000);
  });

  it('AWAITING_PAYMENT booking: collected = 0, cash profit negative', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1',
      totalAmount: 50000,
      payment: { status: 'AWAITING_PAYMENT', paidAmount: 0 },
      assignments: [{ fee: 8000 }],
      bookingExpenses: [{ amount: 2000 }],
    });
    const p = await BookingFinanceService.profit('b1');
    expect(p.collected).toBe(0);
    expect(p.profitCash).toBe(-10000);
    expect(p.profitIfFullyPaid).toBe(40000);
  });

  it('no payment row: collected = 0', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1',
      totalAmount: 10000,
      payment: null,
      assignments: [],
      bookingExpenses: [],
    });
    const p = await BookingFinanceService.profit('b1');
    expect(p.collected).toBe(0);
    expect(p.totalCost).toBe(0);
    expect(p.profitIfFullyPaid).toBe(10000);
  });

  it('throws 404 when booking missing', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue(null);
    await expect(BookingFinanceService.profit('missing')).rejects.toThrow(/Booking not found/);
  });
});

describe('BookingFinanceService.listAssignments', () => {
  it('admin sees fees', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({ id: 'b1', userId: 'owner' });
    (prisma.bookingAssignment.findMany as any).mockResolvedValue([
      { id: 'a1', photographerId: 'p1', fee: 5000, photographer: { id: 'p1', name: 'Rahim' } },
    ]);
    const rows = await BookingFinanceService.listAssignments('b1', 'admin-id', true);
    expect((rows as any[])[0].fee).toBe(5000);
  });

  it('owner (non-admin) gets fee stripped', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({ id: 'b1', userId: 'owner' });
    (prisma.bookingAssignment.findMany as any).mockResolvedValue([
      { id: 'a1', photographerId: 'p1', fee: 5000, photographer: { id: 'p1', name: 'Rahim' } },
    ]);
    const rows = await BookingFinanceService.listAssignments('b1', 'owner', false);
    const first = (rows as any[])[0];
    expect(first.fee).toBeUndefined();
    expect(first.photographer.name).toBe('Rahim');
  });

  it('non-owner non-admin gets 403', async () => {
    (prisma.booking.findUnique as any).mockResolvedValue({ id: 'b1', userId: 'someone' });
    await expect(
      BookingFinanceService.listAssignments('b1', 'other-user', false),
    ).rejects.toThrow(/Not your booking/);
  });
});
