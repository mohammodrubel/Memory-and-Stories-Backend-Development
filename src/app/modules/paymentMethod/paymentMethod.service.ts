import { PaymentMethodType, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';

export interface IPaymentMethodInput {
  name: string;
  type: PaymentMethodType;
  accountNumber: string;
  accountHolder?: string;
  instructions?: string;
  active?: boolean;
  sortOrder?: number;
}

const createPaymentMethod = (data: IPaymentMethodInput) =>
  prisma.paymentMethod.create({ data });

const updatePaymentMethod = (id: string, data: Partial<IPaymentMethodInput>) =>
  prisma.paymentMethod.update({ where: { id }, data });

const deletePaymentMethod = (id: string) =>
  prisma.paymentMethod.delete({ where: { id } });

const getActivePaymentMethods = () =>
  prisma.paymentMethod.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

const getAllPaymentMethods = (opts: { includeInactive?: boolean } = {}) => {
  const where: Prisma.PaymentMethodWhereInput = {};
  if (!opts.includeInactive) where.active = true;
  return prisma.paymentMethod.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
};

const getSinglePaymentMethod = (id: string) =>
  prisma.paymentMethod.findUnique({ where: { id } });

export const PaymentMethodService = {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getActivePaymentMethods,
  getAllPaymentMethods,
  getSinglePaymentMethod,
};
