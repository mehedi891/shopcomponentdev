-- AlterTable
ALTER TABLE "public"."App" ALTER COLUMN "totalOrderCount" SET DEFAULT 0,
ALTER COLUMN "totalOrderValue" SET DEFAULT 0.00;

-- AlterTable
ALTER TABLE "public"."Component" ALTER COLUMN "totalOrderCount" SET DEFAULT 0,
ALTER COLUMN "totalOrderValue" SET DEFAULT 0.00;

-- AlterTable
ALTER TABLE "public"."Shop" ALTER COLUMN "totalOrderCount" SET DEFAULT 0,
ALTER COLUMN "totalOrderValue" SET DEFAULT 0.00;
