-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "billingAddress" TEXT;
ALTER TABLE "Shop" ADD COLUMN "currencyCode" TEXT;
ALTER TABLE "Shop" ADD COLUMN "email" TEXT;
ALTER TABLE "Shop" ADD COLUMN "isFirstInstall" BOOLEAN DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN "myshopifyDomain" TEXT;
ALTER TABLE "Shop" ADD COLUMN "partnerDevelopment" BOOLEAN DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN "shopOwnerName" TEXT;
ALTER TABLE "Shop" ADD COLUMN "shopOwnerPhone" TEXT;
ALTER TABLE "Shop" ADD COLUMN "shopifyPlan" TEXT;
ALTER TABLE "Shop" ADD COLUMN "shopifyPlus" BOOLEAN DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN "weightUnit" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" TEXT,
    "planName" TEXT,
    "price" REAL DEFAULT 0.00,
    "planType" TEXT,
    "planStatus" TEXT DEFAULT 'deactived',
    "shopId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plan_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Plan" ("createdAt", "id", "planId", "planName", "planStatus", "planType", "price", "shopId", "updatedAt") SELECT "createdAt", "id", "planId", "planName", "planStatus", "planType", "price", "shopId", "updatedAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_planId_key" ON "Plan"("planId");
CREATE UNIQUE INDEX "Plan_shopId_key" ON "Plan"("shopId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
