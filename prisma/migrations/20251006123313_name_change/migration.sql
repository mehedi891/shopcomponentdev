/*
  Warnings:

  - You are about to drop the column `couponCode` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Shop" DROP COLUMN "couponCode",
ADD COLUMN     "coupon" TEXT;
