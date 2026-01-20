/*
  Warnings:

  - A unique constraint covering the columns `[monthYear,shopId,affiliateId]` on the table `AffiliateOrdersByMonth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[monthYear,shopId]` on the table `ShopOrdersByMonth` will be added. If there are existing duplicate values, this will fail.
  - Made the column `monthYear` on table `AffiliateOrdersByMonth` required. This step will fail if there are existing NULL values in that column.
  - Made the column `affiliateId` on table `AffiliateOrdersByMonth` required. This step will fail if there are existing NULL values in that column.
  - Made the column `monthYear` on table `ShopOrdersByMonth` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalOrders` on table `ShopOrdersByMonth` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalValue` on table `ShopOrdersByMonth` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."AffiliateOrdersByMonth" DROP CONSTRAINT "AffiliateOrdersByMonth_affiliateId_fkey";

-- DropIndex
DROP INDEX "public"."AffiliateOrdersByMonth_monthYear_key";

-- DropIndex
DROP INDEX "public"."ShopOrdersByMonth_monthYear_key";

-- AlterTable
ALTER TABLE "public"."AffiliateOrdersByMonth" ALTER COLUMN "monthYear" SET NOT NULL,
ALTER COLUMN "affiliateId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."ShopOrdersByMonth" ALTER COLUMN "monthYear" SET NOT NULL,
ALTER COLUMN "totalOrders" SET NOT NULL,
ALTER COLUMN "totalValue" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateOrdersByMonth_monthYear_shopId_affiliateId_key" ON "public"."AffiliateOrdersByMonth"("monthYear", "shopId", "affiliateId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopOrdersByMonth_monthYear_shopId_key" ON "public"."ShopOrdersByMonth"("monthYear", "shopId");

-- AddForeignKey
ALTER TABLE "public"."AffiliateOrdersByMonth" ADD CONSTRAINT "AffiliateOrdersByMonth_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
