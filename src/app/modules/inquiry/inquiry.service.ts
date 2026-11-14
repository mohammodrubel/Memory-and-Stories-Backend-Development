import { InquiryStatus } from '@prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';

const createInquiry = async (p: {
  name: string;
  email: string;
  phone: string;
  service?: string;
  eventDate?: string;
  message: string;
}) => {
  let eventDate: Date | undefined;
  if (p.eventDate) {
    eventDate = new Date(p.eventDate);
    if (Number.isNaN(eventDate.getTime())) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid event date');
  }
  const row = await prisma.inquiry.create({
    data: {
      name: p.name,
      email: p.email,
      phone: p.phone,
      service: p.service || undefined,
      eventDate,
      message: p.message,
    },
  });
  return { id: row.id };
};

const getAllInquiries = async (opts: { page?: number; limit?: number; status?: string }) => {
  const page = opts.page || 1;
  const limit = Math.min(opts.limit || 20, 100);
  const where = opts.status && opts.status in InquiryStatus ? { status: opts.status as InquiryStatus } : {};
  const [data, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }),
    prisma.inquiry.count({ where }),
  ]);
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
};

const updateStatus = (id: string, status: InquiryStatus) =>
  prisma.inquiry.update({ where: { id }, data: { status } });

const deleteInquiry = (id: string) => prisma.inquiry.delete({ where: { id } });

export const InquiryService = { createInquiry, getAllInquiries, updateStatus, deleteInquiry };
