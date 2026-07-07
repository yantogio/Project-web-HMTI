/*
  Warnings:

  - A unique constraint covering the columns `[driveFileId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "showcase_contents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateTime" DATETIME,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "documentId" INTEGER,
    CONSTRAINT "showcase_contents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_driveFileId_key" ON "Document"("driveFileId");

-- CreateIndex
CREATE INDEX "Document_uploadDate_idx" ON "Document"("uploadDate");

-- CreateIndex
CREATE INDEX "Document_driveFileId_idx" ON "Document"("driveFileId");
