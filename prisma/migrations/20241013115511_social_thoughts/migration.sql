-- DropForeignKey
ALTER TABLE `Influence` DROP FOREIGN KEY `Influence_postId_fkey`;

-- AddForeignKey
ALTER TABLE `Influence` ADD CONSTRAINT `Influence_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
