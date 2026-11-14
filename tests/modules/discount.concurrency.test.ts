import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '../../src/app/utils/prisma';
import { DiscountService } from '../../src/app/modules/discount/discount.service';

/**
 * Concurrency tests for applyAtBookingCreation usage-cap guard.
 *
 * Strategy: mock prisma.$transaction to pass through the tx-callback with the
 * same mocked prisma as tx. Then configure discount.findUnique (the inside-tx
 * re-read) to return usageCount:0 on the first call and usageCount:1 (cap hit)
 * on the second call, simulating two concurrent requests where the second one
 * sees the cap already consumed.
 */

// Build a minimal tx that delegates to the mocked prisma
const makeTx = () => prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-23T12:00:00Z'));
  // $transaction passes its callback the prisma mock as tx
  (prisma.$transaction as any).mockImplementation((fn: any) => fn(makeTx()));
});

const baseDiscount = {
  id: 'd1',
  kind: 'COUPON',
  type: 'PERCENT' as const,
  value: 10,
  usageCap: 1,
  usageCount: 0, // appears eligible on first read
  perCustomerLimit: null,
  minBookingAmount: null,
  maxDiscountAmount: null,
  validFrom: new Date('2026-01-01'),
  validTo: new Date('2027-01-01'),
  active: true,
  services: [],
};

const baseInput = {
  tx: makeTx(),
  bookingId: 'b1',
  serviceId: 'svc1',
  subtotal: 5000,
  userId: 'u1',
  couponCode: 'EID10',
  adminId: 'admin1',
};

describe('applyAtBookingCreation – concurrency cap guard (COUPON)', () => {
  it('first call succeeds; second call sees cap exhausted on re-read and returns null', async () => {
    // findFirst (coupon lookup) — always returns eligible discount
    (prisma.discount.findFirst as any).mockResolvedValue(baseDiscount);
    // findMany (auto-sale) — no auto-sales
    (prisma.discount.findMany as any).mockResolvedValue([]);
    // perCustomerLimit check
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);
    // bookingDiscount.create
    (prisma.bookingDiscount.create as any).mockResolvedValue({ id: 'bd1', amount: 500 });
    // discount.update (increment)
    (prisma.discount.update as any).mockResolvedValue({});

    // Inside-tx re-read: first call sees usageCount:0 (slot available),
    // second call sees usageCount:1 (slot taken by first caller).
    (prisma.discount.findUnique as any)
      .mockResolvedValueOnce({ ...baseDiscount, usageCount: 0 }) // first caller: cap not yet hit
      .mockResolvedValueOnce({ ...baseDiscount, usageCount: 1 }); // second caller: cap exhausted

    // Execute both calls sequentially (simulating serialised tx execution)
    const result1 = await DiscountService.applyAtBookingCreation({ ...baseInput, bookingId: 'b1' });
    const result2 = await DiscountService.applyAtBookingCreation({ ...baseInput, bookingId: 'b2' });

    // First call should succeed
    expect(result1.applied).not.toBeNull();
    expect(result1.discountAmount).toBe(500);

    // Second call should be rejected by cap re-check
    expect(result2.applied).toBeNull();
    expect(result2.discountAmount).toBe(0);

    // bookingDiscount.create called exactly once (only first caller)
    expect((prisma.bookingDiscount.create as any).mock.calls.length).toBe(1);
  });

  it('when cap is null (unlimited), both calls succeed', async () => {
    const unlimitedDiscount = { ...baseDiscount, usageCap: null };

    (prisma.discount.findFirst as any).mockResolvedValue(unlimitedDiscount);
    (prisma.discount.findMany as any).mockResolvedValue([]);
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);
    (prisma.bookingDiscount.create as any)
      .mockResolvedValueOnce({ id: 'bd1', amount: 500 })
      .mockResolvedValueOnce({ id: 'bd2', amount: 500 });
    (prisma.discount.update as any).mockResolvedValue({});

    // findUnique re-read: both calls see usageCap:null (no cap enforcement)
    (prisma.discount.findUnique as any).mockResolvedValue({ ...unlimitedDiscount, usageCount: 5 });

    const result1 = await DiscountService.applyAtBookingCreation({ ...baseInput, bookingId: 'b1' });
    const result2 = await DiscountService.applyAtBookingCreation({ ...baseInput, bookingId: 'b2' });

    expect(result1.applied).not.toBeNull();
    expect(result2.applied).not.toBeNull();
    expect((prisma.bookingDiscount.create as any).mock.calls.length).toBe(2);
  });
});
