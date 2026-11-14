import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const parseRange = (from?: string, to?: string) => {
  const where: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    where.date = dateFilter;
  }
  return where;
};

const listExpenses = async (filters: {
  from?: string;
  to?: string;
  categoryId?: string;
  staffId?: string;
}) => {
  const where = {
    ...parseRange(filters.from, filters.to),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.staffId ? { staffId: filters.staffId } : {}),
  };
  return prisma.expense.findMany({
    where,
    include: { category: true, staff: true, recurring: true },
    orderBy: { date: 'desc' },
  });
};

const createExpense = async (data: {
  date: string;
  categoryId: string;
  amount: number;
  note?: string | null;
  staffId?: string | null;
  recurringExpenseId?: string | null;
}) => {
  return prisma.expense.create({
    data: {
      date: new Date(data.date),
      categoryId: data.categoryId,
      amount: data.amount,
      note: data.note ?? null,
      staffId: data.staffId ?? null,
      recurringExpenseId: data.recurringExpenseId ?? null,
    },
  });
};

const updateExpense = async (id: string, data: Record<string, unknown>) => {
  const found = await prisma.expense.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Expense not found');
  const next = { ...data };
  if (typeof next.date === 'string') next.date = new Date(next.date);
  return prisma.expense.update({ where: { id }, data: next as never });
};

const deleteExpense = async (id: string) => {
  const found = await prisma.expense.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Expense not found');
  await prisma.expense.delete({ where: { id } });
  return { id };
};

const listIncomes = async (filters: { from?: string; to?: string; categoryId?: string }) => {
  const where = {
    ...parseRange(filters.from, filters.to),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
  };
  return prisma.income.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' },
  });
};

const createIncome = async (data: {
  date: string;
  categoryId: string;
  amount: number;
  note?: string | null;
  bookingId?: string | null;
}) => {
  return prisma.income.create({
    data: {
      date: new Date(data.date),
      categoryId: data.categoryId,
      amount: data.amount,
      note: data.note ?? null,
      bookingId: data.bookingId ?? null,
    },
  });
};

const updateIncome = async (id: string, data: Record<string, unknown>) => {
  const found = await prisma.income.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Income not found');
  const next = { ...data };
  if (typeof next.date === 'string') next.date = new Date(next.date);
  return prisma.income.update({ where: { id }, data: next as never });
};

const deleteIncome = async (id: string) => {
  const found = await prisma.income.findUnique({ where: { id } });
  if (!found) throw new AppError(httpStatus.NOT_FOUND, 'Income not found');
  await prisma.income.delete({ where: { id } });
  return { id };
};

const getDateRange = (from?: string, to?: string) => {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);
  return { fromDate, toDate };
};

const summary = async (from?: string, to?: string) => {
  const { fromDate, toDate } = getDateRange(from, to);

  const [paymentRows, incomeRows, expenseRows, assignmentRows, bookingExpenseRows, expenseByCat, incomeByCat] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          status: { in: ['PAID', 'PARTIALLY_PAID'] },
          OR: [
            { approvedAt: { gte: fromDate, lte: toDate } },
            { approvedAt: null, createdAt: { gte: fromDate, lte: toDate } },
          ],
        },
        select: { paidAmount: true },
      }),
      prisma.income.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
        select: { amount: true, categoryId: true, category: { select: { name: true } } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
        select: { amount: true, categoryId: true, category: { select: { name: true } } },
      }),
      prisma.bookingAssignment.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        select: { fee: true },
      }),
      prisma.bookingExpense.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        select: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: { date: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
      }),
      prisma.income.groupBy({
        by: ['categoryId'],
        where: { date: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
      }),
    ]);

  const bookingPayments = paymentRows.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const otherIncome = incomeRows.reduce((s, r) => s + (r.amount || 0), 0);
  const revenueTotal = bookingPayments + otherIncome;

  const expensesTotal = expenseRows.reduce((s, r) => s + (r.amount || 0), 0);
  const bookingAssignmentsTotal = assignmentRows.reduce((s, r) => s + (r.fee || 0), 0);
  const bookingExpensesTotal = bookingExpenseRows.reduce((s, r) => s + (r.amount || 0), 0);
  const costsTotal = expensesTotal + bookingAssignmentsTotal + bookingExpensesTotal;

  const profit = revenueTotal - costsTotal;
  const marginPct = revenueTotal > 0 ? (profit / revenueTotal) * 100 : 0;

  const categoryMap = new Map<string, string>();
  expenseRows.forEach((r) => categoryMap.set(r.categoryId, r.category.name));
  incomeRows.forEach((r) => categoryMap.set(r.categoryId, r.category.name));

  const byExpenseCategory = expenseByCat.map((g) => ({
    categoryId: g.categoryId,
    name: categoryMap.get(g.categoryId) || 'Unknown',
    total: g._sum.amount || 0,
    pct: expensesTotal > 0 ? ((g._sum.amount || 0) / expensesTotal) * 100 : 0,
  })).sort((a, b) => b.total - a.total);

  const byIncomeCategory = incomeByCat.map((g) => ({
    categoryId: g.categoryId,
    name: categoryMap.get(g.categoryId) || 'Unknown',
    total: g._sum.amount || 0,
    pct: otherIncome > 0 ? ((g._sum.amount || 0) / otherIncome) * 100 : 0,
  })).sort((a, b) => b.total - a.total);

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    revenue: { bookingPayments, otherIncome, total: revenueTotal },
    costs: {
      expenses: expensesTotal,
      bookingAssignments: bookingAssignmentsTotal,
      bookingExpenses: bookingExpensesTotal,
      total: costsTotal,
    },
    profit,
    marginPct: Math.round(marginPct * 10) / 10,
    byExpenseCategory,
    byIncomeCategory,
  };
};

const formatPeriod = (date: Date, groupBy: 'day' | 'month' | 'year'): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (groupBy === 'year') return `${y}`;
  if (groupBy === 'month') return `${y}-${m}`;
  return `${y}-${m}-${d}`;
};

const timeseries = async (
  from?: string,
  to?: string,
  groupBy: 'day' | 'month' | 'year' = 'month',
) => {
  const { fromDate, toDate } = getDateRange(from, to);

  const [payments, incomes, expenses, assignments, bookingExpenses] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        OR: [
          { approvedAt: { gte: fromDate, lte: toDate } },
          { approvedAt: null, createdAt: { gte: fromDate, lte: toDate } },
        ],
      },
      select: { paidAmount: true, approvedAt: true, createdAt: true },
    }),
    prisma.income.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { amount: true, date: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { amount: true, date: true },
    }),
    prisma.bookingAssignment.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { fee: true, createdAt: true },
    }),
    prisma.bookingExpense.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const buckets = new Map<string, { period: string; revenue: number; costs: number; profit: number }>();
  const bump = (date: Date, revenue: number, cost: number) => {
    const period = formatPeriod(date, groupBy);
    const existing = buckets.get(period) || { period, revenue: 0, costs: 0, profit: 0 };
    existing.revenue += revenue;
    existing.costs += cost;
    existing.profit = existing.revenue - existing.costs;
    buckets.set(period, existing);
  };

  payments.forEach((p) => bump(p.approvedAt ?? p.createdAt, p.paidAmount || 0, 0));
  incomes.forEach((i) => bump(i.date, i.amount || 0, 0));
  expenses.forEach((e) => bump(e.date, 0, e.amount || 0));
  assignments.forEach((a) => bump(a.createdAt, 0, a.fee || 0));
  bookingExpenses.forEach((b) => bump(b.createdAt, 0, b.amount || 0));

  return Array.from(buckets.values()).sort((a, b) => (a.period < b.period ? -1 : 1));
};

const getDrafts = async (month: string) => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month YYYY-MM');
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  end.setHours(23, 59, 59, 999);

  const [recurring, alreadyConfirmed] = await Promise.all([
    prisma.recurringExpense.findMany({
      where: { active: true },
      include: { category: true, staff: true },
    }),
    prisma.expense.findMany({
      where: {
        recurringExpenseId: { not: null },
        date: { gte: start, lte: end },
      },
      select: { recurringExpenseId: true },
    }),
  ]);

  const confirmedSet = new Set(alreadyConfirmed.map((e) => e.recurringExpenseId));
  return recurring
    .filter((r) => !confirmedSet.has(r.id))
    .map((r) => ({
      recurringExpenseId: r.id,
      label: r.label,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      defaultAmount: r.defaultAmount,
      staffId: r.staffId,
      staffName: r.staff?.name || null,
      suggestedDate: new Date(y, m - 1, 1).toISOString(),
    }));
};

const confirmDrafts = async (input: {
  month: string;
  items: Array<{ recurringExpenseId: string; amount: number; date: string; note?: string | null }>;
}) => {
  if (input.items.length === 0) return { created: 0, skipped: 0 };

  const [y, m] = input.month.split('-').map(Number);
  if (!y || !m) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month YYYY-MM');
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const recurringIds = input.items.map((i) => i.recurringExpenseId);

  return prisma.$transaction(async (tx) => {
    const [recurring, alreadyConfirmed] = await Promise.all([
      tx.recurringExpense.findMany({
        where: { id: { in: recurringIds } },
        select: { id: true, categoryId: true, staffId: true },
      }),
      tx.expense.findMany({
        where: {
          recurringExpenseId: { in: recurringIds },
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { recurringExpenseId: true },
      }),
    ]);

    const recurringMap = new Map(recurring.map((r) => [r.id, r]));
    const confirmedSet = new Set(alreadyConfirmed.map((e) => e.recurringExpenseId));

    const data = input.items
      .filter((item) => !confirmedSet.has(item.recurringExpenseId))
      .map((item) => {
        const r = recurringMap.get(item.recurringExpenseId);
        if (!r) return null;
        return {
          date: new Date(item.date),
          categoryId: r.categoryId,
          amount: item.amount,
          note: item.note || null,
          staffId: r.staffId,
          recurringExpenseId: item.recurringExpenseId,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (data.length > 0) {
      await tx.expense.createMany({ data });
    }
    return {
      created: data.length,
      skipped: input.items.length - data.length,
    };
  });
};

export const ExpenseService = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  summary,
  timeseries,
  getDrafts,
  confirmDrafts,
};
