-- CreateTable
CREATE TABLE "Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "driveFileId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT DEFAULT '-',
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedByNia" TEXT NOT NULL,
    CONSTRAINT "Document_uploadedByNia_fkey" FOREIGN KEY ("uploadedByNia") REFERENCES "Member" ("nia") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");
