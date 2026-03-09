-- AlterTable
ALTER TABLE `users` ADD COLUMN `referralCode` VARCHAR(191) NULL,
    ADD COLUMN `referredById` VARCHAR(191) NULL,
    ADD COLUMN `freeClassicMaggiAvailable` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `referralDiscountAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `usedFreeClassicMaggi` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `users_referralCode_key` ON `users`(`referralCode`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_referredById_fkey` FOREIGN KEY (`referredById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
