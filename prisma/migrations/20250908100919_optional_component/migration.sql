-- DropForeignKey
ALTER TABLE "public"."Affiliate" DROP CONSTRAINT "Affiliate_componentId_fkey";

-- AlterTable
ALTER TABLE "public"."Affiliate" ALTER COLUMN "componentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Affiliate" ADD CONSTRAINT "Affiliate_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
