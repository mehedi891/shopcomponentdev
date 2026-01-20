/*
  Warnings:

  - A unique constraint covering the columns `[tracking]` on the table `Component` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Component_tracking_key" ON "public"."Component"("tracking");
