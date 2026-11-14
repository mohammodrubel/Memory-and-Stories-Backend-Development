import prisma from '../../utils/prisma';
import { emit } from '../../utils/notifier';

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
};

export async function createNotification(input: CreateNotificationInput) {
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || null,
      data: (input.data as object) || {},
    },
  });
  emit(input.userId, 'notification', row);
  return row;
}

export async function listForUser(
  userId: string,
  opts: { limit?: number; unread?: boolean } = {},
) {
  const limit = Math.min(opts.limit || 30, 100);
  const where: any = { userId };
  if (opts.unread) where.readAt = null;
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unreadCount };
}

export async function markRead(userId: string, id: string) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== userId) return null;
  if (n.readAt) return n;
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  const r = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: r.count };
}
