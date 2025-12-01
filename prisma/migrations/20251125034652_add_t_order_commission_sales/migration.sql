-- AlterTable
ALTER TABLE "public"."Affiliate" ADD COLUMN     "totalCommission" DOUBLE PRECISION DEFAULT 0.00,
ADD COLUMN     "totalOrderCount" INTEGER DEFAULT 0,
ADD COLUMN     "totalOrderValue" DOUBLE PRECISION DEFAULT 0.00;
