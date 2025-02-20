/*
  Warnings:

  - Added the required column `location` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "location" geometry(Point, 4326) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roomId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
