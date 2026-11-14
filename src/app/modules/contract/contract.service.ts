import prisma from '../../utils/prisma';

export type Clause = { title: string; body: string };

const getTemplate = async () => {
  const row = await prisma.contractTemplate.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  if (row) return row;
  // Auto-create empty template on first read
  return prisma.contractTemplate.create({
    data: {
      title: 'Service Agreement',
      intro:
        'This Service Agreement is made between the Studio and the Customer named in the booking.',
      clauses: [
        {
          title: 'Scope of work',
          body: 'The Studio shall provide photography and/or videography services as described in the selected package.',
        },
        {
          title: 'Payment',
          body: 'Customer agrees to pay the total amount through the payment methods provided. Partial payments are accepted at the discretion of the Studio.',
        },
        {
          title: 'Cancellation',
          body: 'Cancellation must be requested at least 7 days prior to the event date. Payments made are non-refundable after the event date is confirmed.',
        },
      ],
    },
  });
};

const updateTemplate = async (input: {
  title?: string;
  intro?: string | null;
  clauses: Clause[];
}) => {
  const existing = await prisma.contractTemplate.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  if (existing) {
    return prisma.contractTemplate.update({
      where: { id: existing.id },
      data: {
        title: input.title ?? existing.title,
        intro: input.intro ?? existing.intro,
        clauses: input.clauses as any,
      },
    });
  }
  return prisma.contractTemplate.create({
    data: {
      title: input.title || 'Service Agreement',
      intro: input.intro || null,
      clauses: input.clauses as any,
    },
  });
};

const getBookingContract = async (bookingId: string) =>
  prisma.bookingContract.findUnique({ where: { bookingId } });

const signBookingContract = async (input: {
  bookingId: string;
  signatoryName: string;
  signatureDataUrl: string;
  signedIp?: string;
}) => {
  if (!input.signatoryName?.trim())
    throw new Error('Signatory name required');
  if (!input.signatureDataUrl?.startsWith('data:image/'))
    throw new Error('Invalid signature');

  const template = await getTemplate();
  return prisma.bookingContract.upsert({
    where: { bookingId: input.bookingId },
    create: {
      bookingId: input.bookingId,
      signatoryName: input.signatoryName.trim(),
      signatureDataUrl: input.signatureDataUrl,
      snapshotTitle: template.title,
      snapshotIntro: template.intro,
      snapshotClauses: template.clauses as any,
      signedIp: input.signedIp || null,
    },
    update: {
      signatoryName: input.signatoryName.trim(),
      signatureDataUrl: input.signatureDataUrl,
      snapshotTitle: template.title,
      snapshotIntro: template.intro,
      snapshotClauses: template.clauses as any,
      signedAt: new Date(),
      signedIp: input.signedIp || null,
    },
  });
};

export const ContractService = {
  getTemplate,
  updateTemplate,
  getBookingContract,
  signBookingContract,
};
