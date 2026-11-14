-- Soft-delete support for Package (Service) and Product: records referenced by
-- existing bookings/orders are archived instead of hard-deleted.
ALTER TABLE "Service" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- Banner image upload support.
ALTER TABLE "Banner" ADD COLUMN "image" TEXT;
