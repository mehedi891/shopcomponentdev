/*
  Warnings:

  - A unique constraint covering the columns `[componentId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `componentId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "componentId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_componentId_key" ON "public"."Order"("componentId");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
