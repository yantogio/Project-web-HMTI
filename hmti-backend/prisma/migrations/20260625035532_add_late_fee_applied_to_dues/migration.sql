-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dues" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberNia" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amountDue" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "lateFeeApplied" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "finalDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dues_memberNia_fkey" FOREIGN KEY ("memberNia") REFERENCES "Member" ("nia") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Dues" ("amountDue", "amountPaid", "createdAt", "creditBalance", "dueDate", "finalDate", "id", "memberNia", "month", "period", "status", "year") SELECT "amountDue", "amountPaid", "createdAt", "creditBalance", "dueDate", "finalDate", "id", "memberNia", "month", "period", "status", "year" FROM "Dues";
DROP TABLE "Dues";
ALTER TABLE "new_Dues" RENAME TO "Dues";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
