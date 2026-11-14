import prisma from '../../utils/prisma';

const getOverview = async () => {
  const [
    totalUsers,
    totalOrders,
    paidOrders,
    pendingOrders,
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalProducts,
    totalPortfolios,
    totalCategories,
    totalServices,
    totalPackages,
    salesAgg,
    recentOrders,
    recentBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.product.count(),
    prisma.portfolio.count(),
    prisma.category.count(),
    prisma.service2.count(),
    prisma.package.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'PAID' },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    totalOrders,
    totalBookings,
    totalProducts,
    totalPortfolios,
    totalCategories,
    totalServices,
    totalPackages,
    totalSales: salesAgg._sum.total ?? 0,
    paidOrders,
    pendingOrders,
    confirmedBookings,
    pendingBookings,
    recentOrders,
    recentBookings,
  };
};

export const OverviewService = {
  getOverview,
};
