import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const list = async (onlyActive = false) =>
  prisma.eventType.findMany({
    where: onlyActive ? { active: true } : {},
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

const create = async (data: {
  name: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
}) =>
  prisma.eventType.create({
    data: {
      name: data.name,
      icon: data.icon || null,
      sortOrder: data.sortOrder ?? 0,
      active: data.active ?? true,
    },
  });

const update = async (
  id: string,
  data: {
    name?: string;
    icon?: string | null;
    sortOrder?: number;
    active?: boolean;
  },
) => prisma.eventType.update({ where: { id }, data });

// Event types already used on a booking can't be hard-deleted without breaking
// that booking's event rows (BookingEvent.eventTypeId is a required FK) —
// deactivate instead so it drops out of active dropdowns but history stays intact.
const remove = async (id: string) => {
  const existing = await prisma.eventType.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event type not found');
  }

  const usageCount = await prisma.bookingEvent.count({ where: { eventTypeId: id } });

  if (usageCount > 0) {
    const deactivated = await prisma.eventType.update({
      where: { id },
      data: { active: false },
    });
    return { deactivated: true, deleted: false, data: deactivated };
  }

  const deleted = await prisma.eventType.delete({ where: { id } });
  return { deactivated: false, deleted: true, data: deleted };
};

export const EventTypeService = { list, create, update, remove };
