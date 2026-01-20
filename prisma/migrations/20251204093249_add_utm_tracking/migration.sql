-- AlterTable
ALTER TABLE "public"."Component" ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "affiliateId" INTEGER;

-- CreateTable
CREATE TABLE "public"."OrdersByMonth" (
    "id" SERIAL NOT NULL,
    "monthYear" TEXT,
    "totalOrders" INTEGER DEFAULT 0,
    "totalValue" DOUBLE PRECISION DEFAULT 0.00,
    "shopId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "affiliateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdersByMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrdersByMonth_monthYear_key" ON "public"."OrdersByMonth"("monthYear");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrdersByMonth" ADD CONSTRAINT "OrdersByMonth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrdersByMonth" ADD CONSTRAINT "OrdersByMonth_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrdersByMonth" ADD CONSTRAINT "OrdersByMonth_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
