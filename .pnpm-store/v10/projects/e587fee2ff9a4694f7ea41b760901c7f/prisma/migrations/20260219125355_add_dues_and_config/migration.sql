-- CreateTable
CREATE TABLE "Dues" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberNia" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amountDue" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "finalDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dues_memberNia_fkey" FOREIGN KEY ("memberNia") REFERENCES "Member" ("nia") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "duesAmount" INTEGER NOT NULL,
    "lateFee" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "finalDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subCategory" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByNia" TEXT NOT NULL,
    "duesId" INTEGER,
    CONSTRAINT "Transaction_createdByNia_fkey" FOREIGN KEY ("createdByNia") REFERENCES "Member" ("nia") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_duesId_fkey" FOREIGN KEY ("duesId") REFERENCES "Dues" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "category", "createdAt", "createdByNia", "date", "description", "id", "subCategory", "type") SELECT "amount", "category", "createdAt", "createdByNia", "date", "description", "id", "subCategory", "type" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
