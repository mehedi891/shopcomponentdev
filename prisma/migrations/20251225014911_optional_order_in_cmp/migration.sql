-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_componentId_fkey";

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "componentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
