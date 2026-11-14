import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { userRouter } from '../modules/user/user.router';
import { BannerRoutes } from '../modules/banner/banner.router';
import { ServiceRoutes } from '../modules/service2/service2.router';
import { Packagerouter } from '../modules/package/package.router';
import { BookingRoutes } from '../modules/booking/booking.router';
import { OrderRoutes } from '../modules/order/order.router';
import { OverviewRoutes } from '../modules/overview/overview.router';
import { CategoryRoutes } from '../modules/category/category.router';
import { ProductRoutes } from '../modules/product/product.router';
import { PortfolioRoutes } from '../modules/portfolio/portfolio.router';
import { InquiryRoutes } from '../modules/inquiry/inquiry.router';
import { PortfolioCategoryRoutes } from '../modules/portfolioCategory/portfolioCategory.router';
import { InvoiceRoutes } from '../modules/invoice/invoice.router';
import { UploadRoutes } from '../modules/upload/upload.router';
import { PaymentMethodRoutes } from '../modules/paymentMethod/paymentMethod.router';
import { PaymentRoutes } from '../modules/payment/payment.router';
import { SiteSettingsRoutes } from '../modules/siteSettings/siteSettings.router';
import { PhotographerRoutes } from '../modules/photographer/photographer.router';
import { BookingFinanceRoutes } from '../modules/bookingFinance/bookingFinance.router';
import { StaffRoutes } from '../modules/staff/staff.router';
import { FinanceCategoryRoutes } from '../modules/financeCategory/financeCategory.router';
import { RecurringExpenseRoutes } from '../modules/recurringExpense/recurringExpense.router';
import { ExpenseRoutes } from '../modules/expense/expense.router';
import { GoogleDriveRoutes } from '../modules/googleDrive/googleDrive.router';
import { DeliveryRoutes } from '../modules/delivery/delivery.router';
import { NotificationRoutes } from '../modules/notification/notification.router';
import { PrintRequestRoutes } from '../modules/printRequest/printRequest.router';
import { CalendarRoutes } from '../modules/calendar/calendar.router';
import { EventTypeRoutes } from '../modules/eventType/eventType.router';
import { ContractRoutes } from '../modules/contract/contract.router';
import { DiscountRoutes } from '../modules/discount/discount.router';

const router = express.Router();

type Route = {
  path: string;
  route: express.Router;
};

const routes: Route[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/user', route: userRouter },
  { path: '/banner', route: BannerRoutes },
  { path: '/service', route: ServiceRoutes },
  { path: '/package', route: Packagerouter },
  { path: '/booking', route: BookingRoutes },
  { path: '/order', route: OrderRoutes },
  { path: '/overview', route: OverviewRoutes },
  { path: '/category', route: CategoryRoutes },
  { path: '/product', route: ProductRoutes },
  { path: '/portfolio', route: PortfolioRoutes },
  { path: '/inquiry', route: InquiryRoutes },
  { path: '/portfolio-category', route: PortfolioCategoryRoutes },
  { path: '/invoice', route: InvoiceRoutes },
  { path: '/upload', route: UploadRoutes },
  { path: '/payment-method', route: PaymentMethodRoutes },
  { path: '/payment', route: PaymentRoutes },
  { path: '/site-settings', route: SiteSettingsRoutes },
  { path: '/photographer', route: PhotographerRoutes },
  { path: '/booking', route: BookingFinanceRoutes },
  { path: '/staff', route: StaffRoutes },
  { path: '/finance/categories', route: FinanceCategoryRoutes },
  { path: '/finance/recurring', route: RecurringExpenseRoutes },
  { path: '/finance', route: ExpenseRoutes },
  { path: '/integrations/google', route: GoogleDriveRoutes },
  { path: '/deliveries', route: DeliveryRoutes },
  { path: '/notifications', route: NotificationRoutes },
  { path: '/print-requests', route: PrintRequestRoutes },
  { path: '/calendar', route: CalendarRoutes },
  { path: '/event-types', route: EventTypeRoutes },
  { path: '/contract', route: ContractRoutes },
  { path: '/discounts', route: DiscountRoutes },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
