-- CreateTable
CREATE TABLE "Member" (
    "nia" TEXT NOT NULL PRIMARY KEY,
    "npm" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "angkatan" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_npm_key" ON "Member"("npm");
