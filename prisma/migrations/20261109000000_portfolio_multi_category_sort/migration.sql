-- Portfolio: dynamic multi-category + manual sort order. Additive; no data is dropped.
ALTER TABLE "Portfolio" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PortfolioCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PortfolioCategory_name_key" ON "PortfolioCategory"("name");

CREATE TABLE "PortfolioCategoryLink" (
    "portfolioId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "PortfolioCategoryLink_pkey" PRIMARY KEY ("portfolioId","categoryId")
);
CREATE INDEX "PortfolioCategoryLink_categoryId_idx" ON "PortfolioCategoryLink"("categoryId");
ALTER TABLE "PortfolioCategoryLink" ADD CONSTRAINT "PortfolioCategoryLink_portfolioId_fkey"
  FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioCategoryLink" ADD CONSTRAINT "PortfolioCategoryLink_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "PortfolioCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy legacy categories into the new table (reusing ids) and link existing images.
INSERT INTO "PortfolioCategory" ("id","name","createdAt")
  SELECT "id","name","createdAt" FROM "Category"
  WHERE "id" IN (SELECT DISTINCT "categoryId" FROM "Portfolio" WHERE "categoryId" IS NOT NULL);
INSERT INTO "PortfolioCategoryLink" ("portfolioId","categoryId")
  SELECT "id","categoryId" FROM "Portfolio" WHERE "categoryId" IS NOT NULL;

-- Initial sort order for existing rows: newest first (matches previous public order), 1..N.
UPDATE "Portfolio" p SET "sortOrder" = r.rn
  FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, "id") AS rn FROM "Portfolio") r
  WHERE p."id" = r."id";

CREATE INDEX "Portfolio_sortOrder_createdAt_id_idx" ON "Portfolio"("sortOrder","createdAt","id");
