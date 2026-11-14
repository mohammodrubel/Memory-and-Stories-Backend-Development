/**
 * Seed photographers, staff, finance categories, recurring expenses,
 * 6 months of expenses + incomes, and assign photographers + expenses
 * to existing bookings so the finance dashboard has data to display.
 *
 * Run: cd apps/api && npx ts-node prisma/seed-finance.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PHOTOGRAPHERS = [
  { name: 'Rahim Ahmed', phone: '+8801711000001', email: 'rahim@studio.bd', notes: 'Wedding specialist' },
  { name: 'Karim Hossain', phone: '+8801711000002', email: 'karim@studio.bd', notes: 'Portrait + events' },
  { name: 'Sajid Khan', phone: '+8801711000003', email: 'sajid@studio.bd', notes: 'Drone certified' },
  { name: 'Imran Ali', phone: '+8801711000004', email: 'imran@studio.bd', notes: 'Cinematic video' },
  { name: 'Nabil Chowdhury', phone: '+8801711000005', email: 'nabil@studio.bd', notes: 'Studio + lighting' },
];

const STAFF = [
  { name: 'Tania Akter', role: 'editor', monthlySalary: 18000, phone: '+8801812000001' },
  { name: 'Fahim Rahman', role: 'editor', monthlySalary: 16000, phone: '+8801812000002' },
  { name: 'Mou Hossain', role: 'assistant', monthlySalary: 12000, phone: '+8801812000003' },
  { name: 'Asif Mahmud', role: 'manager', monthlySalary: 25000, phone: '+8801812000004' },
  { name: 'Rina Sultana', role: 'other', monthlySalary: 8000, phone: '+8801812000005', notes: 'Office cleaner' },
];

const EXPENSE_CATS = ['Rent', 'Utility', 'Salary', 'Internet', 'Equipment', 'Marketing', 'Transport', 'Other'];
const INCOME_CATS = ['Booking', 'Print Sales', 'Equipment Rental', 'Other'];

const ONE_OFF_EXPENSES = [
  { category: 'Equipment', amount: 45000, note: 'Sony A7 IV body' },
  { category: 'Equipment', amount: 12500, note: '64GB CFexpress cards' },
  { category: 'Marketing', amount: 8000, note: 'Facebook ad campaign — wedding season' },
  { category: 'Marketing', amount: 3500, note: 'Print flyers' },
  { category: 'Transport', amount: 2200, note: 'Out-of-city shoot fuel' },
  { category: 'Transport', amount: 1800, note: 'Equipment courier' },
  { category: 'Other', amount: 5000, note: 'Studio props' },
  { category: 'Other', amount: 1500, note: 'Tea/snacks for crew' },
  { category: 'Equipment', amount: 7800, note: 'Softbox replacement' },
  { category: 'Marketing', amount: 4500, note: 'Instagram ads' },
];

const OTHER_INCOMES = [
  { category: 'Print Sales', amount: 4500, note: 'Wedding album reprint' },
  { category: 'Print Sales', amount: 2800, note: 'Canvas prints' },
  { category: 'Equipment Rental', amount: 6000, note: 'Lens rental — weekend' },
  { category: 'Equipment Rental', amount: 4500, note: 'Lighting kit rental' },
  { category: 'Other', amount: 3500, note: 'Workshop fee' },
  { category: 'Print Sales', amount: 5500, note: 'Bulk photo prints' },
  { category: 'Equipment Rental', amount: 8000, note: 'Drone rental — 2 days' },
];

const BOOKING_EXPENSES_TEMPLATES = [
  { label: 'Transport', amount: 1500 },
  { label: 'Equipment rental', amount: 3500 },
  { label: 'Lunch for crew', amount: 800 },
  { label: 'Backup batteries', amount: 600 },
  { label: 'Assistant fee', amount: 2000 },
];

async function main() {
  console.log('▶ Photographer seed…');
  for (const p of PHOTOGRAPHERS) {
    const existing = await prisma.photographer.findFirst({ where: { phone: p.phone } });
    if (!existing) await prisma.photographer.create({ data: p });
  }

  console.log('▶ Staff seed…');
  for (const s of STAFF) {
    const existing = await prisma.staff.findFirst({ where: { name: s.name } });
    if (!existing) await prisma.staff.create({ data: s });
  }

  console.log('▶ Finance category seed…');
  for (const name of EXPENSE_CATS) {
    await prisma.financeCategory.upsert({
      where: { name_type: { name, type: 'EXPENSE' } },
      update: {},
      create: { name, type: 'EXPENSE' },
    });
  }
  for (const name of INCOME_CATS) {
    await prisma.financeCategory.upsert({
      where: { name_type: { name, type: 'INCOME' } },
      update: {},
      create: { name, type: 'INCOME' },
    });
  }

  const rentCat = await prisma.financeCategory.findUniqueOrThrow({
    where: { name_type: { name: 'Rent', type: 'EXPENSE' } },
  });
  const utilCat = await prisma.financeCategory.findUniqueOrThrow({
    where: { name_type: { name: 'Utility', type: 'EXPENSE' } },
  });
  const internetCat = await prisma.financeCategory.findUniqueOrThrow({
    where: { name_type: { name: 'Internet', type: 'EXPENSE' } },
  });
  const salaryCat = await prisma.financeCategory.findUniqueOrThrow({
    where: { name_type: { name: 'Salary', type: 'EXPENSE' } },
  });

  const allStaff = await prisma.staff.findMany();

  console.log('▶ Recurring expense seed…');
  const recurringTemplates = [
    { label: 'Studio rent', categoryId: rentCat.id, defaultAmount: 25000, staffId: null },
    { label: 'Electricity bill', categoryId: utilCat.id, defaultAmount: 3500, staffId: null },
    { label: 'Water bill', categoryId: utilCat.id, defaultAmount: 800, staffId: null },
    { label: 'Internet', categoryId: internetCat.id, defaultAmount: 1500, staffId: null },
    ...allStaff.map((s) => ({
      label: `Salary — ${s.name}`,
      categoryId: salaryCat.id,
      defaultAmount: s.monthlySalary,
      staffId: s.id,
    })),
  ];
  for (const r of recurringTemplates) {
    const existing = await prisma.recurringExpense.findFirst({ where: { label: r.label } });
    if (!existing) await prisma.recurringExpense.create({ data: r });
  }

  const expCatMap = new Map<string, string>();
  const expCats = await prisma.financeCategory.findMany({ where: { type: 'EXPENSE' } });
  expCats.forEach((c) => expCatMap.set(c.name, c.id));
  const incCatMap = new Map<string, string>();
  const incCats = await prisma.financeCategory.findMany({ where: { type: 'INCOME' } });
  incCats.forEach((c) => incCatMap.set(c.name, c.id));

  const now = new Date();

  console.log('▶ Recurring expense rows for last 6 months (rent, utility, internet, salary)…');
  for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
    const y = now.getFullYear();
    const m = now.getMonth() - monthsBack;
    const date = new Date(y, m, 5);

    await prisma.expense.create({
      data: { date, categoryId: rentCat.id, amount: 25000, note: 'Monthly studio rent' },
    });
    await prisma.expense.create({
      data: { date, categoryId: utilCat.id, amount: 3000 + Math.floor(Math.random() * 1500), note: 'Electricity' },
    });
    await prisma.expense.create({
      data: { date, categoryId: utilCat.id, amount: 700 + Math.floor(Math.random() * 200), note: 'Water' },
    });
    await prisma.expense.create({
      data: { date, categoryId: internetCat.id, amount: 1500, note: 'ISP' },
    });
    for (const s of allStaff) {
      await prisma.expense.create({
        data: {
          date,
          categoryId: salaryCat.id,
          amount: s.monthlySalary,
          staffId: s.id,
          note: `Salary — ${s.name}`,
        },
      });
    }
  }

  console.log('▶ One-off expenses…');
  for (let i = 0; i < ONE_OFF_EXPENSES.length; i++) {
    const e = ONE_OFF_EXPENSES[i];
    const daysBack = Math.floor(Math.random() * 180);
    const date = new Date(now);
    date.setDate(date.getDate() - daysBack);
    await prisma.expense.create({
      data: {
        date,
        categoryId: expCatMap.get(e.category)!,
        amount: e.amount,
        note: e.note,
      },
    });
  }

  console.log('▶ Other incomes…');
  for (const inc of OTHER_INCOMES) {
    const daysBack = Math.floor(Math.random() * 180);
    const date = new Date(now);
    date.setDate(date.getDate() - daysBack);
    await prisma.income.create({
      data: {
        date,
        categoryId: incCatMap.get(inc.category)!,
        amount: inc.amount,
        note: inc.note,
      },
    });
  }

  console.log('▶ Assign photographers + expenses to existing bookings…');
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  const allPhotographers = await prisma.photographer.findMany();
  if (bookings.length === 0) {
    console.log('  (no bookings to assign — skip)');
  } else {
    for (const b of bookings) {
      const existing = await prisma.bookingAssignment.findMany({ where: { bookingId: b.id } });
      if (existing.length > 0) continue;
      const count = 1 + Math.floor(Math.random() * 3);
      const picked = [...allPhotographers].sort(() => Math.random() - 0.5).slice(0, count);
      for (const ph of picked) {
        await prisma.bookingAssignment.create({
          data: {
            bookingId: b.id,
            photographerId: ph.id,
            fee: 3000 + Math.floor(Math.random() * 7000),
          },
        });
      }
      const expCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < expCount; i++) {
        const tpl = BOOKING_EXPENSES_TEMPLATES[Math.floor(Math.random() * BOOKING_EXPENSES_TEMPLATES.length)];
        await prisma.bookingExpense.create({
          data: { bookingId: b.id, label: tpl.label, amount: tpl.amount },
        });
      }
    }
  }

  const totals = {
    photographers: await prisma.photographer.count(),
    staff: await prisma.staff.count(),
    categories: await prisma.financeCategory.count(),
    recurring: await prisma.recurringExpense.count(),
    expenses: await prisma.expense.count(),
    incomes: await prisma.income.count(),
    assignments: await prisma.bookingAssignment.count(),
    bookingExpenses: await prisma.bookingExpense.count(),
  };
  console.log('✓ Done. Totals:', totals);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
