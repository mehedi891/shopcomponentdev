-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
