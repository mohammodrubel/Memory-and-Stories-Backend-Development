-- Simplify Portfolio: image is the only required field.
-- title and categoryId become optional; existing rows and images are preserved.
ALTER TABLE "Portfolio" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "Portfolio" ALTER COLUMN "categoryId" DROP NOT NULL;
