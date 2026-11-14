"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const getOverview = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const [totalUsers, totalOrders, paidOrders, pendingOrders, totalBookings, confirmedBookings, pendingBookings, totalProducts, totalPortfolios, totalCategories, totalServices, totalPackages, salesAgg, recentOrders, recentBookings,] = yield Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.order.count(),
        prisma_1.default.order.count({ where: { status: 'PAID' } }),
        prisma_1.default.order.count({ where: { status: 'PENDING' } }),
        prisma_1.default.booking.count(),
        prisma_1.default.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma_1.default.booking.count({ where: { status: 'PENDING' } }),
        prisma_1.default.product.count(),
        prisma_1.default.portfolio.count(),
        prisma_1.default.category.count(),
        prisma_1.default.service2.count(),
        prisma_1.default.package.count(),
        prisma_1.default.order.aggregate({
            _sum: { total: true },
            where: { status: 'PAID' },
        }),
        prisma_1.default.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma_1.default.booking.findMany({
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
        totalSales: (_a = salesAgg._sum.total) !== null && _a !== void 0 ? _a : 0,
        paidOrders,
        pendingOrders,
        confirmedBookings,
        pendingBookings,
        recentOrders,
        recentBookings,
    };
});
exports.OverviewService = {
    getOverview,
};
