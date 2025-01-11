-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "shared_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "video_id" TEXT NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    CONSTRAINT "shared_links_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
