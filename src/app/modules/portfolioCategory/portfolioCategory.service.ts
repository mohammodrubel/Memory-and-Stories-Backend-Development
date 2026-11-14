import prisma from '../../utils/prisma';

const list = async () => {
  const rows = await prisma.portfolioCategory.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { portfolios: true } } },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, count: _count.portfolios }));
};

const create = (payload: { name: string }) =>
  prisma.portfolioCategory.create({ data: { name: payload.name } });

const update = (id: string, payload: { name: string }) =>
  prisma.portfolioCategory.update({ where: { id }, data: { name: payload.name } });

// Join rows cascade; portfolio images themselves are never deleted.
const remove = (id: string) => prisma.portfolioCategory.delete({ where: { id } });

export const PortfolioCategoryService = { list, create, update, remove };
