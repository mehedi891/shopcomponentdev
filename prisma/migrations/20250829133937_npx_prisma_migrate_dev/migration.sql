/*
  Warnings:

  - The `planActivatedAt` column on the `Shop` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Shop" DROP COLUMN "planActivatedAt",
ADD COLUMN     "planActivatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
