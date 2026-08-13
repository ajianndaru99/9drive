-- Add role column to users table if it doesn't exist
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` VARCHAR(32) NOT NULL DEFAULT 'user';
