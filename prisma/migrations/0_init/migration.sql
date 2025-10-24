-- CreateTable
CREATE TABLE `Contributor` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `headshotUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `Contributor_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `contentUrl` VARCHAR(191) NOT NULL,
    `alt` VARCHAR(191) NOT NULL,
    `contributorId` VARCHAR(191) NULL,
    `contributorText` VARCHAR(191) NOT NULL,

    INDEX `Media_contributorId_idx`(`contributorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Podcast` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `publicationDate` DATETIME(3) NOT NULL,
    `audioUrl` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,

    UNIQUE INDEX `Podcast_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NOT NULL,
    `focus` TEXT NOT NULL,
    `body` JSON NOT NULL,
    `publicationDate` DATETIME(3) NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `section` ENUM('News', 'Opinions', 'Features', 'Science', 'Sports', 'Arts', 'Humor', 'Podcasts') NOT NULL,
    `thumbnailId` VARCHAR(191) NULL,

    UNIQUE INDEX `Article_slug_key`(`slug`),
    INDEX `Article_thumbnailId_idx`(`thumbnailId`),
    FULLTEXT INDEX `Article_headline_idx`(`headline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArticleSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NOT NULL,
    `focus` TEXT NOT NULL,
    `body` JSON NOT NULL,
    `section` ENUM('News', 'Opinions', 'Features', 'Science', 'Sports', 'Arts', 'Humor', 'Podcasts') NOT NULL,
    `thumbnailId` VARCHAR(191) NULL,

    INDEX `ArticleSubmission_thumbnailId_idx`(`thumbnailId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ContributorToPodcast` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ContributorToPodcast_AB_unique`(`A`, `B`),
    INDEX `_ContributorToPodcast_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArticleToContributor` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ArticleToContributor_AB_unique`(`A`, `B`),
    INDEX `_ArticleToContributor_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_media` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_media_AB_unique`(`A`, `B`),
    INDEX `_media_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArticleSubmissionToContributor` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ArticleSubmissionToContributor_AB_unique`(`A`, `B`),
    INDEX `_ArticleSubmissionToContributor_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_mediaSubmissions` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_mediaSubmissions_AB_unique`(`A`, `B`),
    INDEX `_mediaSubmissions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

