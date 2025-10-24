/*
  Warnings:

  - You are about to alter the column `section` on the `Article` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.
  - You are about to alter the column `section` on the `ArticleSubmission` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `Article` MODIFY `section` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `ArticleSubmission` MODIFY `section` VARCHAR(191) NOT NULL;
UPDATE `Article` SET `section` = LOWER(`section`);
UPDATE `ArticleSubmission` SET `section` = LOWER(`section`);
