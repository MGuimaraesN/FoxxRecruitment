-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Institution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'university',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Institution" ("id", "name", "type") SELECT "id", "name", "type" FROM "Institution";
DROP TABLE "Institution";
ALTER TABLE "new_Institution" RENAME TO "Institution";
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
