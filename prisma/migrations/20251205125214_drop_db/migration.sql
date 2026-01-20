/*
  Warnings:

  - You are about to drop the column `affiliateId` on the `OrdersByMonth` table. All the data in the column will be lost.
  - You are about to drop the column `componentId` on the `OrdersByMonth` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrdersByMonth" DROP CONSTRAINT "OrdersByMonth_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrdersByMonth" DROP CONSTRAINT "OrdersByMonth_componentId_fkey";

-- AlterTable
ALTER TABLE "public"."OrdersByMonth" DROP COLUMN "affiliateId",
DROP COLUMN "componentId";
