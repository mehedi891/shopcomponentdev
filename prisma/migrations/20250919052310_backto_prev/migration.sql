-- CreateEnum
CREATE TYPE "public"."APPLIES_TO" AS ENUM ('product', 'collection');

-- CreateEnum
CREATE TYPE "public"."LAYOUT" AS ENUM ('grid', 'list', 'gridSlider');

-- CreateEnum
CREATE TYPE "public"."STATUS" AS ENUM ('actived', 'deactived');

-- CreateEnum
CREATE TYPE "public"."PLAN_TYPE" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "public"."PLAN_NAME" AS ENUM ('Free', 'Growth');

-- CreateEnum
CREATE TYPE "public"."PLAN_STATUS" AS ENUM ('ACTIVE', 'CANCELLED', 'DECLINED', 'EXPIRED', 'FROZEN', 'PENDING');
