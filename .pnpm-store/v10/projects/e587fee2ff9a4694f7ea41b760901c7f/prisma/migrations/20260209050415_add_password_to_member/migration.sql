-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "nia" TEXT NOT NULL PRIMARY KEY,
    "npm" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "angkatan" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" TEXT NOT NULL DEFAULT 'password123'
);
INSERT INTO "new_Member" ("angkatan", "jabatan", "joinedAt", "name", "nia", "npm", "role", "status") SELECT "angkatan", "jabatan", "joinedAt", "name", "nia", "npm", "role", "status" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_npm_key" ON "Member"("npm");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
