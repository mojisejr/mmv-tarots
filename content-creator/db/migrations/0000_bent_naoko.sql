CREATE TABLE `content_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`input_data` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`caption` text,
	`image_path` text,
	`media_fbid` text,
	`fb_post_id` text,
	`publish_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`posted_at` integer
);
