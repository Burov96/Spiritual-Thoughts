-- AlterTable
ALTER TABLE `Message` ADD COLUMN `read` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `typing` BOOLEAN NOT NULL DEFAULT false;
