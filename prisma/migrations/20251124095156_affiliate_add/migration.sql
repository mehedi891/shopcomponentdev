/*
  Warnings:

  - You are about to drop the column `comissionAmount` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `comissionPercentage` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `componentId` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `paypalId` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Affiliate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Affiliate" DROP CONSTRAINT "Affiliate_componentId_fkey";

-- DropIndex
DROP INDEX "public"."Affiliate_componentId_key";

-- AlterTable
ALTER TABLE "public"."Affiliate" DROP COLUMN "comissionAmount",
DROP COLUMN "comissionPercentage",
DROP COLUMN "componentId",
DROP COLUMN "description",
DROP COLUMN "paypalId",
DROP COLUMN "url",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "commissionCiteria" TEXT,
ADD COLUMN     "fixedCommission" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payoutMethods" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "tieredCommission" JSONB,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "public"."Component" ADD COLUMN     "affiliateId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Component" ADD CONSTRAINT "Component_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
