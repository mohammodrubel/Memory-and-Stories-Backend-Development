import bcrypt from 'bcrypt';
import { PrintStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import { createNotification } from '../notification/notification.service';

const EDITABLE: PrintStatus[] = [
  PrintStatus.DRAFT,
  PrintStatus.CHANGES_REQUESTED,
];

async function getOrCreateDraft(userId: string, bookingId: string) {
  const existing = await prisma.printRequest.findFirst({
    where: { bookingId, userId, status: { in: EDITABLE } },
    include: { selections: true },
  });
  if (existing) return existing;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Not your booking');
  if (!booking.deliveryFolderId) throw new Error('Booking not delivered');
  if (!booking.printLimit || booking.printLimit <= 0) {
    throw new Error('Print not enabled for this booking');
  }

  return prisma.printRequest.create({
    data: {
      bookingId,
      userId,
      maxPhotos: booking.printLimit,
      status: PrintStatus.DRAFT,
    },
    include: { selections: true },
  });
}

async function listForUser(userId: string) {
  return prisma.printRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      selections: true,
      booking: { select: { id: true, deliveryFolderName: true } },
    },
  });
}

async function listAll() {
  return prisma.printRequest.findMany({
    where: { status: { not: PrintStatus.DRAFT } },
    orderBy: { updatedAt: 'desc' },
    include: {
      selections: true,
      booking: {
        select: {
          id: true,
          deliveryFolderName: true,
          service: { select: { title: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

async function getOne(id: string, userId: string | null, isAdmin: boolean) {
  const r = await prisma.printRequest.findUnique({
    where: { id },
    include: {
      selections: true,
      booking: { select: { id: true, deliveryFolderName: true, deliveryFolderId: true, service: { select: { title: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!r) return null;
  if (!isAdmin && r.userId !== userId) return null;
  return r;
}

async function updateSelections(
  id: string,
  userId: string,
  payload: { add?: { fileId: string; fileName: string }[]; remove?: string[] },
) {
  const req = await prisma.printRequest.findUnique({
    where: { id },
    include: { booking: true, selections: true },
  });
  if (!req) throw new Error('Print request not found');
  if (req.userId !== userId) throw new Error('Not your request');
  if (!EDITABLE.includes(req.status)) throw new Error('Request locked');
  if (!req.booking.deliveryFolderId) throw new Error('Booking not delivered');

  if (payload.remove?.length) {
    await prisma.printSelection.deleteMany({
      where: { printRequestId: id, fileId: { in: payload.remove } },
    });
  }

  if (payload.add?.length) {
    // Validate from DeliveryFile snapshot (no Drive API call)
    const fileIds = payload.add.map((a) => a.fileId);
    const rows = await prisma.deliveryFile.findMany({
      where: { bookingId: req.bookingId, fileId: { in: fileIds } },
    });
    const rowMap = new Map(rows.map((r) => [r.fileId, r]));
    const enriched: {
      fileId: string;
      fileName: string;
      parentFolderId: string | null;
      parentFolderName: string | null;
    }[] = [];
    for (const item of payload.add) {
      const r = rowMap.get(item.fileId);
      if (!r) throw new Error(`File ${item.fileId} not in delivery tree`);
      if (r.isFolder || !r.mimeType.startsWith('image/')) {
        throw new Error(`File ${item.fileId} not an image`);
      }
      enriched.push({
        fileId: r.fileId,
        fileName: r.fileName,
        parentFolderId: r.parentFolderId,
        parentFolderName: r.parentFolderName,
      });
    }
    const current = await prisma.printSelection.count({
      where: { printRequestId: id },
    });
    const wouldBe =
      current + payload.add.length - (payload.remove?.length || 0);
    if (wouldBe > req.maxPhotos) {
      throw new Error(`Exceeds limit of ${req.maxPhotos} photos`);
    }
    await prisma.printSelection.createMany({
      data: enriched.map((a) => ({ printRequestId: id, ...a })),
      skipDuplicates: true,
    });
  }

  return prisma.printRequest.findUnique({
    where: { id },
    include: { selections: true },
  });
}

async function submit(id: string, userId: string, password: string) {
  const req = await prisma.printRequest.findUnique({
    where: { id },
    include: { selections: true, user: true },
  });
  if (!req) throw new Error('Print request not found');
  if (req.userId !== userId) throw new Error('Not your request');
  if (!EDITABLE.includes(req.status)) throw new Error('Already submitted');
  if (req.selections.length === 0) throw new Error('Select at least one photo');

  const ok = await bcrypt.compare(password, req.user.password);
  if (!ok) throw new Error('Wrong password');

  const updated = await prisma.printRequest.update({
    where: { id },
    data: {
      status: PrintStatus.SUBMITTED,
      submittedAt: new Date(),
      adminNote: null,
    },
    include: { booking: { select: { service: { select: { title: true } } } } },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  for (const a of admins) {
    await createNotification({
      userId: a.id,
      type: 'print.requested',
      title: `New print request from ${req.user.name}`,
      body: `${req.selections.length} photo(s) for ${updated.booking.service?.title || 'booking'}`,
      data: {
        printRequestId: id,
        link: `/dashboard/admin/print-requests/${id}`,
      },
    });
  }
  return updated;
}

async function adminAction(
  id: string,
  action:
    | 'request-changes'
    | 'approve'
    | 'start-printing'
    | 'deliver'
    | 'reject',
  payload?: { note?: string; reason?: string },
) {
  const req = await prisma.printRequest.findUnique({ where: { id } });
  if (!req) throw new Error('Not found');

  let nextStatus: PrintStatus | null = null;
  const data: any = {};
  let title = '';
  let body = '';

  if (action === 'request-changes') {
    if (req.status !== PrintStatus.SUBMITTED) {
      throw new Error('Only SUBMITTED can be sent back');
    }
    nextStatus = PrintStatus.CHANGES_REQUESTED;
    data.adminNote = payload?.note || null;
    title = 'Admin requested changes to your print selection';
    body = payload?.note || 'Please review and resubmit.';
  } else if (action === 'approve') {
    if (req.status !== PrintStatus.SUBMITTED) {
      throw new Error('Only SUBMITTED can be approved');
    }
    nextStatus = PrintStatus.APPROVED;
    data.approvedAt = new Date();
    title = 'Your print request was approved';
    body = 'We will start printing soon.';
  } else if (action === 'start-printing') {
    if (req.status !== PrintStatus.APPROVED) {
      throw new Error('Must be APPROVED first');
    }
    nextStatus = PrintStatus.PRINTING;
    data.printingAt = new Date();
    title = 'Your prints are now being printed';
    body = '';
  } else if (action === 'deliver') {
    if (req.status !== PrintStatus.PRINTING) {
      throw new Error('Must be PRINTING first');
    }
    nextStatus = PrintStatus.DELIVERED;
    data.printDeliveredAt = new Date();
    title = 'Your prints have been delivered';
    body = '';
  } else if (action === 'reject') {
    if (
      req.status !== PrintStatus.SUBMITTED &&
      req.status !== PrintStatus.CHANGES_REQUESTED
    ) {
      throw new Error('Cannot reject at this stage');
    }
    nextStatus = PrintStatus.REJECTED;
    data.rejectionReason = payload?.reason || 'No reason given';
    title = 'Your print request was rejected';
    body = data.rejectionReason;
  }
  if (!nextStatus) throw new Error('Bad action');
  data.status = nextStatus;

  const updated = await prisma.printRequest.update({
    where: { id },
    data,
  });

  await createNotification({
    userId: req.userId,
    type: `print.${action}`,
    title,
    body,
    data: {
      printRequestId: id,
      link: `/dashboard/user/prints/${id}`,
    },
  });

  return updated;
}

export const PrintRequestService = {
  getOrCreateDraft,
  listForUser,
  listAll,
  getOne,
  updateSelections,
  submit,
  adminAction,
};
