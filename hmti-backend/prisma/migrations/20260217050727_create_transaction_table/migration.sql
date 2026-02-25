-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subCategory" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByNia" TEXT NOT NULL,
    CONSTRAINT "Transaction_createdByNia_fkey" FOREIGN KEY ("createdByNia") REFERENCES "Member" ("nia") ON DELETE RESTRICT ON UPDATE CASCADE
);
