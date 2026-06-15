CREATE TABLE `content_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`template_id` text NOT NULL,
	`seed_payload` text NOT NULL,
	`draft_data` text,
	`status` text DEFAULT 'GENERATING' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`generation_token` text,
	`generating_at` integer,
	`attempt_key` text,
	`finalize_key` text,
	`content_post_id` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_drafts_request_key_unique` ON `content_drafts` (`request_key`);