import { describe, it, expect } from 'vitest';
import prisma from '../../src/app/utils/prisma';
import { ExpenseService } from '../../src/app/modules/expense/expense.service';

describe('ExpenseService.summary', () => {
  it('attributes payment revenue using approvedAt when present', async () => {
    (prisma.payment.findMany as any).mockResolvedValue([{ paidAmount: 10000 }]);
    (prisma.income.findMany as any).mockResolvedValue([]);
    (prisma.expense.findMany as any).mockResolvedValue([]);
    (prisma.bookingAssignment.findMany as any).mockResolvedValue([]);
    (prisma.bookingExpense.findMany as any).mockResolvedValue([]);
    (prisma.expense.groupBy as any).mockResolvedValue([]);
    (prisma.income.groupBy as any).mockResolvedValue([]);

    await ExpenseService.summary('2026-06-01', '2026-06-30');
    const where = (prisma.payment.findMany as any).mock.calls[0][0].where;
    // P1 regression: must use approvedAt (with createdAt fallback), NOT updatedAt
    expect(where.updatedAt).toBeUndefined();
    expect(where.OR).toBeDefined();
    const orKeys = where.OR.map((c: any) => Object.keys(c).filter((k) => k !== 'approvedAt')).flat();
    expect(orKeys).toContain('createdAt');
  });

  it('computes profit + margin correctly', async () => {
    (prisma.payment.findMany as any).mockResolvedValue([{ paidAmount: 100000 }]);
    (prisma.income.findMany as any).mockResolvedValue([
      { amount: 20000, categoryId: 'c1', category: { name: 'Print' } },
    ]);
    (prisma.expense.findMany as any).mockResolvedValue([
      { amount: 30000, categoryId: 'e1', category: { name: 'Rent' } },
    ]);
    (prisma.bookingAssignment.findMany as any).mockResolvedValue([{ fee: 5000 }]);
    (prisma.bookingExpense.findMany as any).mockResolvedValue([{ amount: 2500 }]);
    (prisma.expense.groupBy as any).mockResolvedValue([{ categoryId: 'e1', _sum: { amount: 30000 } }]);
    (prisma.income.groupBy as any).mockResolvedValue([{ categoryId: 'c1', _sum: { amount: 20000 } }]);

    const s = await ExpenseService.summary('2026-06-01', '2026-06-30');
    expect(s.revenue.bookingPayments).toBe(100000);
    expect(s.revenue.otherIncome).toBe(20000);
    expect(s.revenue.total).toBe(120000);
    expect(s.costs.total).toBe(37500); // 30000 + 5000 + 2500
    expect(s.profit).toBe(82500);
    expect(s.marginPct).toBeCloseTo(68.8, 1);
  });
});

describe('ExpenseService.confirmDrafts (P2 idempotency)', () => {
  it('skips items already confirmed for the month', async () => {
    (prisma.recurringExpense.findMany as any).mockResolvedValue([
      { id: 'r1', categoryId: 'c1', staffId: null },
      { id: 'r2', categoryId: 'c2', staffId: null },
    ]);
    // r1 already confirmed this month, r2 not
    (prisma.expense.findMany as any).mockResolvedValue([{ recurringExpenseId: 'r1' }]);
    (prisma.expense.createMany as any).mockResolvedValue({ count: 1 });

    const result = await ExpenseService.confirmDrafts({
      month: '2026-06',
      items: [
        { recurringExpenseId: 'r1', amount: 25000, date: '2026-06-01' },
        { recurringExpenseId: 'r2', amount: 3000, date: '2026-06-01' },
      ],
    });
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);

    const createCall = (prisma.expense.createMany as any).mock.calls[0][0];
    expect(createCall.data).toHaveLength(1);
    expect(createCall.data[0].recurringExpenseId).toBe('r2');
  });

  it('all-duplicate batch creates zero rows', async () => {
    (prisma.recurringExpense.findMany as any).mockResolvedValue([
      { id: 'r1', categoryId: 'c1', staffId: null },
    ]);
    (prisma.expense.findMany as any).mockResolvedValue([{ recurringExpenseId: 'r1' }]);

    const result = await ExpenseService.confirmDrafts({
      month: '2026-06',
      items: [{ recurringExpenseId: 'r1', amount: 25000, date: '2026-06-01' }],
    });
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(prisma.expense.createMany).not.toHaveBeenCalled();
  });

  it('rejects invalid month format', async () => {
    await expect(
      ExpenseService.confirmDrafts({
        month: 'bad',
        items: [{ recurringExpenseId: 'r1', amount: 1, date: '2026-06-01' }],
      }),
    ).rejects.toThrow(/Invalid month/);
  });

  it('empty items returns zero, no DB calls', async () => {
    const result = await ExpenseService.confirmDrafts({ month: '2026-06', items: [] });
    expect(result).toEqual({ created: 0, skipped: 0 });
    expect(prisma.recurringExpense.findMany).not.toHaveBeenCalled();
  });
});
