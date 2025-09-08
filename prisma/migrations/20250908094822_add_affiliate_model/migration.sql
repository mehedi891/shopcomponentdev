-- CreateTable
CREATE TABLE "public"."Affiliate" (
    "id" SERIAL NOT NULL,
    "name" TEXT DEFAULT 'SPC_affiliate',
    "affTrackingCode" TEXT DEFAULT 'SPC_affiliate_tracking',
    "url" TEXT,
    "email" TEXT,
    "description" TEXT,
    "comissionPercentage" DOUBLE PRECISION DEFAULT 0.00,
    "comissionAmount" DOUBLE PRECISION DEFAULT 0.00,
    "componentId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_affTrackingCode_key" ON "public"."Affiliate"("affTrackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_componentId_key" ON "public"."Affiliate"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_shopId_key" ON "public"."Affiliate"("shopId");

-- AddForeignKey
ALTER TABLE "public"."Affiliate" ADD CONSTRAINT "Affiliate_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Affiliate" ADD CONSTRAINT "Affiliate_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
