import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const ensureBookingAccess = async (bookingId: string, userId: string, isAdmin: boolean) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (!isAdmin && booking.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Not your booking');
  }
  return booking;
};

const listAssignments = async (bookingId: string, userId: string, isAdmin: boolean) => {
  await ensureBookingAccess(bookingId, userId, isAdmin);
  const rows = await prisma.bookingAssignment.findMany({
    where: { bookingId },
    include: { photographer: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  if (isAdmin) return rows;
  return rows.map((r) => ({
    id: r.id,
    photographerId: r.photographerId,
    photographer: r.photographer,
  }));
};

const createAssignment = async (
  bookingId: string,
  data: { photographerId: string; fee: number },
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  const photographer = await prisma.photographer.findUnique({
    where: { id: data.photographerId },
  });
  if (!photographer) throw new AppError(httpStatus.NOT_FOUND, 'Photographer not found');
  try {
    return await prisma.bookingAssignment.create({
      data: {
        bookingId,
        photographerId: data.photographerId,
        fee: data.fee,
      },
      include: { photographer: { select: { id: true, name: true } } },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      throw new AppError(httpStatus.CONFLICT, 'Photographer already assigned to booking');
    }
    throw err;
  }
};

const updateAssignment = async (
  bookingId: string,
  id: string,
  data: { photographerId?: string; fee?: number },
) => {
  const row = await prisma.bookingAssignment.findUnique({ where: { id } });
  if (!row || row.bookingId !== bookingId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Assignment not found');
  }
  return prisma.bookingAssignment.update({
    where: { id },
    data,
    include: { photographer: { select: { id: true, name: true } } },
  });
};

const deleteAssignment = async (bookingId: string, id: string) => {
  const row = await prisma.bookingAssignment.findUnique({ where: { id } });
  if (!row || row.bookingId !== bookingId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Assignment not found');
  }
  await prisma.bookingAssignment.delete({ where: { id } });
  return { id };
};

const listExpenses = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  return prisma.bookingExpense.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
  });
};

const createExpense = async (bookingId: string, data: { label: string; amount: number }) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  return prisma.bookingExpense.create({
    data: { bookingId, label: data.label, amount: data.amount },
  });
};

const updateExpense = async (
  bookingId: string,
  id: string,
  data: { label?: string; amount?: number },
) => {
  const row = await prisma.bookingExpense.findUnique({ where: { id } });
  if (!row || row.bookingId !== bookingId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Expense not found');
  }
  return prisma.bookingExpense.update({ where: { id }, data });
};

const deleteExpense = async (bookingId: string, id: string) => {
  const row = await prisma.bookingExpense.findUnique({ where: { id } });
  if (!row || row.bookingId !== bookingId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Expense not found');
  }
  await prisma.bookingExpense.delete({ where: { id } });
  return { id };
};

const profit = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      assignments: true,
      bookingExpenses: true,
    },
  });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  const booked = booking.totalAmount || 0;
  const collected =
    booking.payment && (booking.payment.status === 'PAID' || booking.payment.status === 'PARTIALLY_PAID')
      ? booking.payment.paidAmount || 0
      : 0;
  const assignmentFees = booking.assignments.reduce((s, a) => s + (a.fee || 0), 0);
  const bookingExpenses = booking.bookingExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCost = assignmentFees + bookingExpenses;
  const profitIfFullyPaid = booked - totalCost;
  const profitCash = collected - totalCost;

  return {
    booked,
    collected,
    assignmentFees,
    bookingExpenses,
    totalCost,
    profitIfFullyPaid,
    profitCash,
  };
};

export const BookingFinanceService = {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  profit,
};
