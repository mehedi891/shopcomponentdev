-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Component" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appliesTo" TEXT NOT NULL DEFAULT 'product',
    "addToCartType" JSONB NOT NULL,
    "enableQtyField" BOOLEAN NOT NULL DEFAULT false,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "status" TEXT NOT NULL DEFAULT 'deactived',
    "componentSettings" JSONB,
    "shoppingCartSettings" JSONB,
    "productLayoutSettings" JSONB,
    "buttonStyleSettings" JSONB,
    "tracking" TEXT,
    "customerTracking" TEXT,
    "compHtml" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" SERIAL NOT NULL,
    "shopifyShopGid" TEXT,
    "shopifyDomain" TEXT NOT NULL,
    "scAccessToken" TEXT,
    "headlessAccessToken" TEXT,
    "installationCount" INTEGER,
    "maxAllowedComponents" INTEGER DEFAULT 1,
    "name" TEXT,
    "url" TEXT,
    "isFirstInstall" BOOLEAN DEFAULT true,
    "partnerDevelopment" BOOLEAN DEFAULT true,
    "shopOwnerName" TEXT,
    "email" TEXT,
    "shopOwnerPhone" TEXT,
    "currencyCode" TEXT,
    "weightUnit" TEXT,
    "billingAddress" TEXT,
    "shopifyPlan" TEXT,
    "appPlan" TEXT DEFAULT 'Free',
    "trialDays" INTEGER DEFAULT 7,
    "planActivatedAt" TEXT,
    "shopifyPlus" BOOLEAN DEFAULT false,
    "myshopifyDomain" TEXT,
    "appDisabled" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" SERIAL NOT NULL,
    "planId" TEXT,
    "planName" TEXT,
    "price" DOUBLE PRECISION DEFAULT 0.00,
    "planType" TEXT,
    "planStatus" TEXT DEFAULT 'deactived',
    "shopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyShopGid_key" ON "public"."Shop"("shopifyShopGid");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyDomain_key" ON "public"."Shop"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_planId_key" ON "public"."Plan"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_shopId_key" ON "public"."Plan"("shopId");

-- AddForeignKey
ALTER TABLE "public"."Component" ADD CONSTRAINT "Component_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plan" ADD CONSTRAINT "Plan_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
