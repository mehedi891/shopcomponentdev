-- DropForeignKey
ALTER TABLE "public"."AffiliateTransaction" DROP CONSTRAINT "AffiliateTransaction_affiliateId_fkey";

-- AddForeignKey
ALTER TABLE "public"."AffiliateTransaction" ADD CONSTRAINT "AffiliateTransaction_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
