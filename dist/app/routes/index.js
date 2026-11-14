"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/auth/auth.routes");
const user_router_1 = require("../modules/user/user.router");
const banner_router_1 = require("../modules/banner/banner.router");
const service2_router_1 = require("../modules/service2/service2.router");
const package_router_1 = require("../modules/package/package.router");
const booking_router_1 = require("../modules/booking/booking.router");
const order_router_1 = require("../modules/order/order.router");
const overview_router_1 = require("../modules/overview/overview.router");
const category_router_1 = require("../modules/category/category.router");
const product_router_1 = require("../modules/product/product.router");
const portfolio_router_1 = require("../modules/portfolio/portfolio.router");
const inquiry_router_1 = require("../modules/inquiry/inquiry.router");
const portfolioCategory_router_1 = require("../modules/portfolioCategory/portfolioCategory.router");
const invoice_router_1 = require("../modules/invoice/invoice.router");
const upload_router_1 = require("../modules/upload/upload.router");
const paymentMethod_router_1 = require("../modules/paymentMethod/paymentMethod.router");
const payment_router_1 = require("../modules/payment/payment.router");
const siteSettings_router_1 = require("../modules/siteSettings/siteSettings.router");
const photographer_router_1 = require("../modules/photographer/photographer.router");
const bookingFinance_router_1 = require("../modules/bookingFinance/bookingFinance.router");
const staff_router_1 = require("../modules/staff/staff.router");
const financeCategory_router_1 = require("../modules/financeCategory/financeCategory.router");
const recurringExpense_router_1 = require("../modules/recurringExpense/recurringExpense.router");
const expense_router_1 = require("../modules/expense/expense.router");
const googleDrive_router_1 = require("../modules/googleDrive/googleDrive.router");
const delivery_router_1 = require("../modules/delivery/delivery.router");
const notification_router_1 = require("../modules/notification/notification.router");
const printRequest_router_1 = require("../modules/printRequest/printRequest.router");
const calendar_router_1 = require("../modules/calendar/calendar.router");
const eventType_router_1 = require("../modules/eventType/eventType.router");
const contract_router_1 = require("../modules/contract/contract.router");
const discount_router_1 = require("../modules/discount/discount.router");
const router = express_1.default.Router();
const routes = [
    { path: '/auth', route: auth_routes_1.AuthRoutes },
    { path: '/user', route: user_router_1.userRouter },
    { path: '/banner', route: banner_router_1.BannerRoutes },
    { path: '/service', route: service2_router_1.ServiceRoutes },
    { path: '/package', route: package_router_1.Packagerouter },
    { path: '/booking', route: booking_router_1.BookingRoutes },
    { path: '/order', route: order_router_1.OrderRoutes },
    { path: '/overview', route: overview_router_1.OverviewRoutes },
    { path: '/category', route: category_router_1.CategoryRoutes },
    { path: '/product', route: product_router_1.ProductRoutes },
    { path: '/portfolio', route: portfolio_router_1.PortfolioRoutes },
    { path: '/inquiry', route: inquiry_router_1.InquiryRoutes },
    { path: '/portfolio-category', route: portfolioCategory_router_1.PortfolioCategoryRoutes },
    { path: '/invoice', route: invoice_router_1.InvoiceRoutes },
    { path: '/upload', route: upload_router_1.UploadRoutes },
    { path: '/payment-method', route: paymentMethod_router_1.PaymentMethodRoutes },
    { path: '/payment', route: payment_router_1.PaymentRoutes },
    { path: '/site-settings', route: siteSettings_router_1.SiteSettingsRoutes },
    { path: '/photographer', route: photographer_router_1.PhotographerRoutes },
    { path: '/booking', route: bookingFinance_router_1.BookingFinanceRoutes },
    { path: '/staff', route: staff_router_1.StaffRoutes },
    { path: '/finance/categories', route: financeCategory_router_1.FinanceCategoryRoutes },
    { path: '/finance/recurring', route: recurringExpense_router_1.RecurringExpenseRoutes },
    { path: '/finance', route: expense_router_1.ExpenseRoutes },
    { path: '/integrations/google', route: googleDrive_router_1.GoogleDriveRoutes },
    { path: '/deliveries', route: delivery_router_1.DeliveryRoutes },
    { path: '/notifications', route: notification_router_1.NotificationRoutes },
    { path: '/print-requests', route: printRequest_router_1.PrintRequestRoutes },
    { path: '/calendar', route: calendar_router_1.CalendarRoutes },
    { path: '/event-types', route: eventType_router_1.EventTypeRoutes },
    { path: '/contract', route: contract_router_1.ContractRoutes },
    { path: '/discounts', route: discount_router_1.DiscountRoutes },
];
routes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
