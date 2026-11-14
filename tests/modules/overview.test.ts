import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '../../src/app/utils/prisma';
import { OverviewService } from '../../src/app/modules/overview/overview.service';

beforeEach(() => {
  (prisma.user.count as any).mockResolvedValue(42);
  (prisma.order.count as any).mockResolvedValue(10);
  (prisma.booking.count as any).mockResolvedValue(5);
  (prisma.product.count as any).mockResolvedValue(8);
  (prisma.portfolio.count as any).mockResolvedValue(12);
  (prisma.category.count as any).mockResolvedValue(4);
  (prisma.service2.count as any).mockResolvedValue(3);
  (prisma.package.count as any).mockResolvedValue(2);
  (prisma.order.aggregate as any).mockResolvedValue({ _sum: { total: 1234.5 } });
  (prisma.order.findMany as any).mockResolvedValue([]);
  (prisma.booking.findMany as any).mockResolvedValue([]);
});

describe('OverviewService', () => {
  it('returns a flat shape compatible with the frontend dashboard', async () => {
    const result = await OverviewService.getOverview();
    expect(result.totalUsers).toBe(42);
    expect(result.totalSales).toBe(1234.5);
    expect(result.totalProducts).toBe(8);
    expect(result.recentOrders).toEqual([]);
    expect(result.recentBookings).toEqual([]);
  });

  it('treats a null sales aggregate as zero revenue', async () => {
    (prisma.order.aggregate as any).mockResolvedValue({
      _sum: { total: null },
    });
    const result = await OverviewService.getOverview();
    expect(result.totalSales).toBe(0);
  });
});
