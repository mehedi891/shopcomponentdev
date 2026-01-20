/*
  Warnings:

  - You are about to drop the `AffiliateOrdersByMonth` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AffiliateOrdersByMonth" DROP CONSTRAINT "AffiliateOrdersByMonth_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AffiliateOrdersByMonth" DROP CONSTRAINT "AffiliateOrdersByMonth_shopId_fkey";

-- DropTable
DROP TABLE "public"."AffiliateOrdersByMonth";
