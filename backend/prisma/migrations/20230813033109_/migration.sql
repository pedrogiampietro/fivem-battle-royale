/*
  Warnings:

  - Added the required column `GameType` to the `GroupMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "GameType" "GameType" NOT NULL;
