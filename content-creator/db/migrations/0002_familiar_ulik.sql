ALTER TABLE `content_posts` ADD `request_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `content_posts_request_key_unique` ON `content_posts` (`request_key`);