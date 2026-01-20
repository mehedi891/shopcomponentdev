-- AlterTable
ALTER TABLE "public"."Affiliate" ADD COLUMN     "paypalId" TEXT;

-- AlterTable
ALTER TABLE "public"."Component" ADD COLUMN     "totalOrderCount" INTEGER,
ADD COLUMN     "totalOrderValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Shop" ADD COLUMN     "totalOrderCount" INTEGER,
ADD COLUMN     "totalOrderValue" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."App" (
    "id" SERIAL NOT NULL,
    "totalOrderCount" INTEGER,
    "totalOrderValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);
