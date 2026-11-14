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
exports.ExpenseService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const parseRange = (from, to) => {
    const where = {};
    if (from || to) {
        const dateFilter = {};
        if (from)
            dateFilter.gte = new Date(from);
        if (to) {
            const end = new Date(to);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }
        where.date = dateFilter;
    }
    return where;
};
const listExpenses = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = Object.assign(Object.assign(Object.assign({}, parseRange(filters.from, filters.to)), (filters.categoryId ? { categoryId: filters.categoryId } : {})), (filters.staffId ? { staffId: filters.staffId } : {}));
    return prisma_1.default.expense.findMany({
        where,
        include: { category: true, staff: true, recurring: true },
        orderBy: { date: 'desc' },
    });
});
const createExpense = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    return prisma_1.default.expense.create({
        data: {
            date: new Date(data.date),
            categoryId: data.categoryId,
            amount: data.amount,
            note: (_a = data.note) !== null && _a !== void 0 ? _a : null,
            staffId: (_b = data.staffId) !== null && _b !== void 0 ? _b : null,
            recurringExpenseId: (_c = data.recurringExpenseId) !== null && _c !== void 0 ? _c : null,
        },
    });
});
const updateExpense = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.expense.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Expense not found');
    const next = Object.assign({}, data);
    if (typeof next.date === 'string')
        next.date = new Date(next.date);
    return prisma_1.default.expense.update({ where: { id }, data: next });
});
const deleteExpense = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.expense.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Expense not found');
    yield prisma_1.default.expense.delete({ where: { id } });
    return { id };
});
const listIncomes = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = Object.assign(Object.assign({}, parseRange(filters.from, filters.to)), (filters.categoryId ? { categoryId: filters.categoryId } : {}));
    return prisma_1.default.income.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
    });
});
const createIncome = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    return prisma_1.default.income.create({
        data: {
            date: new Date(data.date),
            categoryId: data.categoryId,
            amount: data.amount,
            note: (_a = data.note) !== null && _a !== void 0 ? _a : null,
            bookingId: (_b = data.bookingId) !== null && _b !== void 0 ? _b : null,
        },
    });
});
const updateIncome = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.income.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Income not found');
    const next = Object.assign({}, data);
    if (typeof next.date === 'string')
        next.date = new Date(next.date);
    return prisma_1.default.income.update({ where: { id }, data: next });
});
const deleteIncome = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield prisma_1.default.income.findUnique({ where: { id } });
    if (!found)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Income not found');
    yield prisma_1.default.income.delete({ where: { id } });
    return { id };
});
const getDateRange = (from, to) => {
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);
    return { fromDate, toDate };
};
const summary = (from, to) => __awaiter(void 0, void 0, void 0, function* () {
    const { fromDate, toDate } = getDateRange(from, to);
    const [paymentRows, incomeRows, expenseRows, assignmentRows, bookingExpenseRows, expenseByCat, incomeByCat] = yield Promise.all([
        prisma_1.default.payment.findMany({
            where: {
                status: { in: ['PAID', 'PARTIALLY_PAID'] },
                OR: [
                    { approvedAt: { gte: fromDate, lte: toDate } },
                    { approvedAt: null, createdAt: { gte: fromDate, lte: toDate } },
                ],
            },
            select: { paidAmount: true },
        }),
        prisma_1.default.income.findMany({
            where: { date: { gte: fromDate, lte: toDate } },
            select: { amount: true, categoryId: true, category: { select: { name: true } } },
        }),
        prisma_1.default.expense.findMany({
            where: { date: { gte: fromDate, lte: toDate } },
            select: { amount: true, categoryId: true, category: { select: { name: true } } },
        }),
        prisma_1.default.bookingAssignment.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            select: { fee: true },
        }),
        prisma_1.default.bookingExpense.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            select: { amount: true },
        }),
        prisma_1.default.expense.groupBy({
            by: ['categoryId'],
            where: { date: { gte: fromDate, lte: toDate } },
            _sum: { amount: true },
        }),
        prisma_1.default.income.groupBy({
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
    const categoryMap = new Map();
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
});
const formatPeriod = (date, groupBy) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    if (groupBy === 'year')
        return `${y}`;
    if (groupBy === 'month')
        return `${y}-${m}`;
    return `${y}-${m}-${d}`;
};
const timeseries = (from_1, to_1, ...args_1) => __awaiter(void 0, [from_1, to_1, ...args_1], void 0, function* (from, to, groupBy = 'month') {
    const { fromDate, toDate } = getDateRange(from, to);
    const [payments, incomes, expenses, assignments, bookingExpenses] = yield Promise.all([
        prisma_1.default.payment.findMany({
            where: {
                status: { in: ['PAID', 'PARTIALLY_PAID'] },
                OR: [
                    { approvedAt: { gte: fromDate, lte: toDate } },
                    { approvedAt: null, createdAt: { gte: fromDate, lte: toDate } },
                ],
            },
            select: { paidAmount: true, approvedAt: true, createdAt: true },
        }),
        prisma_1.default.income.findMany({
            where: { date: { gte: fromDate, lte: toDate } },
            select: { amount: true, date: true },
        }),
        prisma_1.default.expense.findMany({
            where: { date: { gte: fromDate, lte: toDate } },
            select: { amount: true, date: true },
        }),
        prisma_1.default.bookingAssignment.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            select: { fee: true, createdAt: true },
        }),
        prisma_1.default.bookingExpense.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            select: { amount: true, createdAt: true },
        }),
    ]);
    const buckets = new Map();
    const bump = (date, revenue, cost) => {
        const period = formatPeriod(date, groupBy);
        const existing = buckets.get(period) || { period, revenue: 0, costs: 0, profit: 0 };
        existing.revenue += revenue;
        existing.costs += cost;
        existing.profit = existing.revenue - existing.costs;
        buckets.set(period, existing);
    };
    payments.forEach((p) => { var _a; return bump((_a = p.approvedAt) !== null && _a !== void 0 ? _a : p.createdAt, p.paidAmount || 0, 0); });
    incomes.forEach((i) => bump(i.date, i.amount || 0, 0));
    expenses.forEach((e) => bump(e.date, 0, e.amount || 0));
    assignments.forEach((a) => bump(a.createdAt, 0, a.fee || 0));
    bookingExpenses.forEach((b) => bump(b.createdAt, 0, b.amount || 0));
    return Array.from(buckets.values()).sort((a, b) => (a.period < b.period ? -1 : 1));
});
const getDrafts = (month) => __awaiter(void 0, void 0, void 0, function* () {
    const [y, m] = month.split('-').map(Number);
    if (!y || !m)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid month YYYY-MM');
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    end.setHours(23, 59, 59, 999);
    const [recurring, alreadyConfirmed] = yield Promise.all([
        prisma_1.default.recurringExpense.findMany({
            where: { active: true },
            include: { category: true, staff: true },
        }),
        prisma_1.default.expense.findMany({
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
        .map((r) => {
        var _a;
        return ({
            recurringExpenseId: r.id,
            label: r.label,
            categoryId: r.categoryId,
            categoryName: r.category.name,
            defaultAmount: r.defaultAmount,
            staffId: r.staffId,
            staffName: ((_a = r.staff) === null || _a === void 0 ? void 0 : _a.name) || null,
            suggestedDate: new Date(y, m - 1, 1).toISOString(),
        });
    });
});
const confirmDrafts = (input) => __awaiter(void 0, void 0, void 0, function* () {
    if (input.items.length === 0)
        return { created: 0, skipped: 0 };
    const [y, m] = input.month.split('-').map(Number);
    if (!y || !m)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid month YYYY-MM');
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const recurringIds = input.items.map((i) => i.recurringExpenseId);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const [recurring, alreadyConfirmed] = yield Promise.all([
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
            if (!r)
                return null;
            return {
                date: new Date(item.date),
                categoryId: r.categoryId,
                amount: item.amount,
                note: item.note || null,
                staffId: r.staffId,
                recurringExpenseId: item.recurringExpenseId,
            };
        })
            .filter((x) => x !== null);
        if (data.length > 0) {
            yield tx.expense.createMany({ data });
        }
        return {
            created: data.length,
            skipped: input.items.length - data.length,
        };
    }));
});
exports.ExpenseService = {
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
