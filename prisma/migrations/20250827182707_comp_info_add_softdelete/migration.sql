-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Component" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Component_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Component" ("addToCartType", "appliesTo", "buttonStyleSettings", "compHtml", "componentSettings", "createdAt", "customerTracking", "description", "enableQtyField", "id", "layout", "productLayoutSettings", "shopId", "shoppingCartSettings", "status", "title", "tracking", "updatedAt") SELECT "addToCartType", "appliesTo", "buttonStyleSettings", "compHtml", "componentSettings", "createdAt", "customerTracking", "description", "enableQtyField", "id", "layout", "productLayoutSettings", "shopId", "shoppingCartSettings", "status", "title", "tracking", "updatedAt" FROM "Component";
DROP TABLE "Component";
ALTER TABLE "new_Component" RENAME TO "Component";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
