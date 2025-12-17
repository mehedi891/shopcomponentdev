/*
  Warnings:

  - The `shopifyOrderNumber` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "shopifyOrderNumber",
ADD COLUMN     "shopifyOrderNumber" INTEGER;
