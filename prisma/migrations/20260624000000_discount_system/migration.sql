-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('AUTO_SALE', 'COUPON');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "DiscountSource" AS ENUM ('AUTO_SALE', 'COUPON', 'AD_HOC');

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "kind" "DiscountKind" NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "usageCap" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "minBookingAmount" DOUBLE PRECISION,
    "maxDiscountAmount" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_kind_active_validFrom_validTo_idx" ON "Discount"("kind", "active", "validFrom", "validTo");

-- CreateTable
CREATE TABLE "DiscountService" (
    "discountId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "DiscountService_pkey" PRIMARY KEY ("discountId","serviceId")
);

-- CreateIndex
CREATE INDEX "DiscountService_serviceId_idx" ON "DiscountService"("serviceId");

-- CreateTable
CREATE TABLE "BookingDiscount" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "discountId" TEXT,
    "source" "DiscountSource" NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "appliedById" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDiscount_bookingId_key" ON "BookingDiscount"("bookingId");

-- CreateIndex
CREATE INDEX "BookingDiscount_discountId_idx" ON "BookingDiscount"("discountId");

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "refundDueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "DiscountService" ADD CONSTRAINT "DiscountService_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountService" ADD CONSTRAINT "DiscountService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDiscount" ADD CONSTRAINT "BookingDiscount_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDiscount" ADD CONSTRAINT "BookingDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: set subtotal = totalAmount for existing bookings
UPDATE "Booking" SET "subtotal" = "totalAmount" WHERE "subtotal" = 0;
