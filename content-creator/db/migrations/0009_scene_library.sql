CREATE TABLE `scene_library` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text NOT NULL,
	`image_path` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`gen_batch` text NOT NULL,
	`created_at` integer NOT NULL,
	`approved_at` integer,
	`retired_at` integer
);
