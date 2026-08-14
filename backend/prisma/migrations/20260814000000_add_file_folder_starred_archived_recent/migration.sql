ALTER TABLE `files`
  ADD COLUMN `is_starred` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `is_archived` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `last_opened_at` DATETIME(3) NULL;

CREATE INDEX `files_user_id_is_starred_status_idx` ON `files`(`user_id`, `is_starred`, `status`);
CREATE INDEX `files_user_id_is_archived_status_idx` ON `files`(`user_id`, `is_archived`, `status`);
CREATE INDEX `files_user_id_last_opened_at_idx` ON `files`(`user_id`, `last_opened_at`);

ALTER TABLE `folders`
  ADD COLUMN `is_starred` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `is_archived` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `last_opened_at` DATETIME(3) NULL;

CREATE INDEX `folders_user_id_is_starred_deleted_at_idx` ON `folders`(`user_id`, `is_starred`, `deleted_at`);
CREATE INDEX `folders_user_id_is_archived_deleted_at_idx` ON `folders`(`user_id`, `is_archived`, `deleted_at`);
