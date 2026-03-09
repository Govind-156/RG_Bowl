-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL,
    `operatingHours` VARCHAR(191) NOT NULL DEFAULT '19:00-03:00',
    `isOrderingPaused` BOOLEAN NOT NULL DEFAULT false,
    `pauseReason` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
