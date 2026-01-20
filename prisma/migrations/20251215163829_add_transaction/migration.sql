-- CreateTable
CREATE TABLE "public"."AffiliateTransaction" (
    "id" SERIAL NOT NULL,
    "affiliateId" INTEGER NOT NULL,
    "commissionPaid" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "transactionDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AffiliateTransaction" ADD CONSTRAINT "AffiliateTransaction_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
