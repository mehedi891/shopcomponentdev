/*
  Warnings:

  - You are about to drop the `OrdersByMonth` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrdersByMonth" DROP CONSTRAINT "OrdersByMonth_shopId_fkey";

-- DropTable
DROP TABLE "public"."OrdersByMonth";

-- CreateTable
CREATE TABLE "public"."ShopOrdersByMonth" (
    "id" SERIAL NOT NULL,
    "monthYear" TEXT,
    "totalOrders" INTEGER DEFAULT 0,
    "totalValue" DOUBLE PRECISION DEFAULT 0.00,
    "shopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopOrdersByMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AffiliateOrdersByMonth" (
    "id" SERIAL NOT NULL,
    "monthYear" TEXT,
    "totalOrders" INTEGER DEFAULT 0,
    "totalValue" DOUBLE PRECISION DEFAULT 0.00,
    "shopId" INTEGER NOT NULL,
    "affiliateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateOrdersByMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopOrdersByMonth_monthYear_key" ON "public"."ShopOrdersByMonth"("monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateOrdersByMonth_monthYear_key" ON "public"."AffiliateOrdersByMonth"("monthYear");

-- AddForeignKey
ALTER TABLE "public"."ShopOrdersByMonth" ADD CONSTRAINT "ShopOrdersByMonth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateOrdersByMonth" ADD CONSTRAINT "AffiliateOrdersByMonth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateOrdersByMonth" ADD CONSTRAINT "AffiliateOrdersByMonth_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
